import type { AtLeast, FileAttachmentProps, IE2EEMessage, IMessage, IUploadToConfirm } from '@rocket.chat/core-typings';
import { imperativeModal, GenericModal } from '@rocket.chat/ui-client';

import { sdk } from '../../../../app/utils/client/lib/SDKClient';
import { t } from '../../../../app/utils/lib/i18n';
import { getFileExtension } from '../../../../lib/utils/getFileExtension';
import { e2e } from '../../e2ee/rocketchat.e2e';
import type { E2ERoom } from '../../e2ee/rocketchat.e2e.room';
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

async function continueSendingMessage(store: UploadsAPI, message: IMessage) {
	const { msg, rid, tmid } = message;
	const e2eRoom = await e2e.getInstanceByRoomId(rid);
	const shouldConvertSentMessages = await e2eRoom?.shouldConvertSentMessages({ msg });
	const filesToUpload = store.get();

	const confirmFilesQueue: (IUploadToConfirm & {
		composedMessage: AtLeast<IMessage, 'msg' | 'tmid' | 't' | 'content'> & { fileName?: string; fileContent?: IE2EEMessage['content'] };
	})[] = [];

	const validFiles = filesToUpload.filter((file) => !file.error);

	for (const upload of validFiles) {
		if (!upload.url || !upload.id) {
			continue;
		}

		/**
		 * The first message will keep the composedMessage,
		 * subsequent messages will have a empty text
		 * */
		const currentMsg = upload === validFiles[0] ? msg : '';

		let content;
		if (!e2eRoom || !isEncryptedUpload(upload)) {
			confirmFilesQueue.push({
				_id: upload.id,
				name: upload.file.name,
				composedMessage: { tmid, msg: currentMsg, fileName: upload.file.name },
			});
			continue;
		}

		const fileContent = await e2eRoom.encryptMessageContent(upload.metadataForEncryption);

		if (shouldConvertSentMessages) {
			content = await getEncryptedContent([upload], e2eRoom, currentMsg);
		}

		const composedMessage = {
			tmid,
			content,
			t: 'e2e',
			msg: '',
			fileContent,
		} as const;

		confirmFilesQueue.push({ _id: upload.id, name: upload.file.name, content: fileContent, composedMessage });
	}

	try {
		store.setProcessingUploads(true);
		for (const fileToConfirm of confirmFilesQueue) {
			await sdk.rest.post(`/v1/rooms.mediaConfirm/${rid}/${fileToConfirm._id}`, fileToConfirm.composedMessage);
			store.removeUpload(fileToConfirm._id);
		}
	} catch (error: unknown) {
		dispatchToastMessage({ type: 'error', message: error });
	} finally {
		store.setProcessingUploads(false);
	}

	return true;
}

export const processMessageUploads = async (chat: ChatAPI, message: IMessage): Promise<boolean> => {
	const store = chat.composer?.uploads;

	if (!store) {
		return false;
	}

	const filesToUpload = store.get();

	if (filesToUpload.length === 0) {
		return false;
	}

	const failedUploads = filesToUpload.filter((upload) => upload.error);

	if (!failedUploads.length) {
		return continueSendingMessage(store, message);
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
					},
				}),
				...(!allUploadsFailed && {
					title: t('Are_you_sure'),
					confirmText: t('Send_anyway'),
					cancelText: t('Cancel'),
					onConfirm: () => {
						imperativeModal.close();
						failedUploads.forEach((upload) => store.removeUpload(upload.id));
						resolve(continueSendingMessage(store, message));
					},
					onCancel: () => {
						imperativeModal.close();
					},
				}),
				onClose: () => {
					imperativeModal.close();
				},
			},
		});
	});
};
