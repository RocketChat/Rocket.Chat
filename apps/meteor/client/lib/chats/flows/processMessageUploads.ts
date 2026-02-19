import type { AtLeast, FileAttachmentProps, IMessage, IUploadToConfirm } from '@rocket.chat/core-typings';
import { isOmnichannelRoom } from '@rocket.chat/core-typings';
import { Random } from '@rocket.chat/random';
import { imperativeModal, GenericModal } from '@rocket.chat/ui-client';

import { sdk } from '../../../../app/utils/client/lib/SDKClient';
import { t } from '../../../../app/utils/lib/i18n';
import { getFileExtension } from '../../../../lib/utils/getFileExtension';
import { e2e } from '../../e2ee/rocketchat.e2e';
import type { E2ERoom } from '../../e2ee/rocketchat.e2e.room';
import { settings } from '../../settings';
import { dispatchToastMessage } from '../../toast';
import type { ChatAPI, UploadsAPI } from '../ChatAPI';
import { isEncryptedUpload, type EncryptedUpload } from '../Upload';

const getHeightAndWidthFromDataUrl = (dataURL: string): Promise<{ height: number; width: number }> => {
	return new Promise((resolve, reject) => {
		const img = new Image();
		img.onload = () => {
			resolve({
				height: img.height,
				width: img.width,
			});
		};
		img.onerror = () => {
			reject(new Error('Failed to load image for dimensions'));
		};
		img.src = dataURL;
	});
};

const getAttachmentForFile = async (fileToUpload: EncryptedUpload): Promise<FileAttachmentProps> => {
	const attachment: FileAttachmentProps = {
		title: fileToUpload.file.name,
		type: 'file',
		title_link: fileToUpload.url,
		title_link_download: true,
		encryption: {
			key: fileToUpload.encryptedFile.key,
			iv: fileToUpload.encryptedFile.iv,
		},
		hashes: {
			sha256: fileToUpload.encryptedFile.hash,
		},
		fileId: fileToUpload.id,
	};

	const fileType = fileToUpload.file.type.match(/^(image|audio|video)\/.+/)?.[1] as 'image' | 'audio' | 'video' | undefined;

	if (!fileType) {
		return {
			...attachment,
			size: fileToUpload.file.size,
			format: getFileExtension(fileToUpload.file.name),
		};
	}

	return {
		...attachment,
		[`${fileType}_url`]: fileToUpload.url,
		[`${fileType}_type`]: fileToUpload.file.type,
		[`${fileType}_size`]: fileToUpload.file.size,
		...(fileType === 'image' && {
			image_dimensions: await getHeightAndWidthFromDataUrl(window.URL.createObjectURL(fileToUpload.file)),
		}),
	};
};

const getEncryptedContent = async (filesToUpload: readonly EncryptedUpload[], e2eRoom: E2ERoom, msg: string) => {
	const attachments: FileAttachmentProps[] = [];

	const arrayOfFiles = await Promise.all(
		filesToUpload.map(async (fileToUpload) => {
			attachments.push(await getAttachmentForFile(fileToUpload));

			const file = {
				_id: fileToUpload.id,
				name: fileToUpload.file.name,
				type: fileToUpload.file.type,
				size: fileToUpload.file.size,
				format: getFileExtension(fileToUpload.file.name),
			};

			return file;
		}),
	);

	return e2eRoom.encryptMessageContent({
		attachments,
		files: arrayOfFiles,
		file: arrayOfFiles[0],
		msg,
	});
};

async function continueSendingMessage(chat: ChatAPI, store: UploadsAPI, message: IMessage) {
	const { msg, tmid } = message;
	const room = await chat.data.getRoom();
	const e2eRoom = await e2e.getInstanceByRoomId(room._id);
	const filesToUpload = store.get();

	const multiFilePerMessageEnabled = settings.peek('FileUpload_EnableMultipleFilesPerMessage') as boolean;

	const fileUrls: string[] = [];
	const filesToConfirm: IUploadToConfirm[] = [];

	for await (const upload of filesToUpload) {
		if (!upload.url || !upload.id) {
			continue;
		}

		let content;
		if (e2eRoom && isEncryptedUpload(upload)) {
			content = await e2eRoom.encryptMessageContent(upload.metadataForEncryption);
		}

		fileUrls.push(upload.url);
		filesToConfirm.push({ _id: upload.id, name: upload.file.name, content });
	}

	const shouldConvertSentMessages = await e2eRoom?.shouldConvertSentMessages({ msg });

	let content;
	const hasEncryptedUploads = filesToUpload.some((upload) => isEncryptedUpload(upload));

	if (e2eRoom && shouldConvertSentMessages) {
		const encryptedUploads = filesToUpload.filter((upload): upload is EncryptedUpload => isEncryptedUpload(upload));

		if (encryptedUploads.length > 0) {
			content = await getEncryptedContent(encryptedUploads, e2eRoom, msg);
		}
	}

	const shouldMarkAsE2E = e2eRoom && (content || hasEncryptedUploads);

	const composedMessage: AtLeast<IMessage, 'msg' | '_id' | 'rid'> = {
		...message,
		tmid,
		msg,
		content,
		...(shouldMarkAsE2E && {
			t: 'e2e',
			msg: '',
		}),
	} as const;

	try {
		if ((!multiFilePerMessageEnabled || isOmnichannelRoom(room)) && filesToConfirm.length > 1) {
			await Promise.all(
				filesToConfirm.map((fileToConfirm, index) => {
					/**
					 * The first message will keep the composedMessage,
					 * subsequent messages will have a new ID with empty text
					 * */
					const messageToSend = index === 0 ? composedMessage : { ...composedMessage, _id: Random.id(), msg: '' };
					return sdk.call('sendMessage', messageToSend, [fileUrls[index]], [fileToConfirm]);
				}),
			);
		} else {
			await sdk.call('sendMessage', composedMessage, fileUrls, filesToConfirm);
		}
		store.clear();
	} catch (error: unknown) {
		dispatchToastMessage({ type: 'error', message: error });
	} finally {
		chat.action.stop('uploading');
	}

	return true;
}

export const processMessageUploads = async (chat: ChatAPI, message: IMessage): Promise<boolean> => {
	const { tmid } = message;

	const store = tmid ? chat.threadUploads : chat.uploads;
	const filesToUpload = store.get();

	if (filesToUpload.length === 0) {
		return false;
	}

	const failedUploads = filesToUpload.filter((upload) => upload.error);

	if (!failedUploads.length) {
		return continueSendingMessage(chat, store, message);
	}

	const allUploadsFailed = failedUploads.length === filesToUpload.length;

	return new Promise((resolve) => {
		imperativeModal.open({
			component: GenericModal,
			props: {
				variant: 'warning',
				children: t('__count__files_failed_to_upload', {
					count: failedUploads.length,
					...(failedUploads.length === 1 && { name: failedUploads[0].file.name }),
				}),
				...(allUploadsFailed && {
					title: t('Warning'),
					confirmText: t('Ok'),
					onConfirm: () => {
						imperativeModal.close();
						resolve(true);
					},
				}),
				...(!allUploadsFailed && {
					title: t('Are_you_sure'),
					confirmText: t('Send_anyway'),
					cancelText: t('Cancel'),
					onConfirm: () => {
						imperativeModal.close();
						resolve(continueSendingMessage(chat, store, message));
					},
					onCancel: () => {
						imperativeModal.close();
						resolve(true);
					},
				}),
				onClose: () => {
					imperativeModal.close();
					resolve(true);
				},
			},
		});
	});
};
