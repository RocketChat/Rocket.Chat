import type { AtLeast, FileAttachmentProps, IMessage, IUploadToConfirm } from '@rocket.chat/core-typings';

import { sdk } from '../../../../app/utils/client/lib/SDKClient';
import { getFileExtension } from '../../../../lib/utils/getFileExtension';
import { e2e } from '../../e2ee/rocketchat.e2e';
import type { E2ERoom } from '../../e2ee/rocketchat.e2e.room';
import { dispatchToastMessage } from '../../toast';
import type { ChatAPI } from '../ChatAPI';
import { isEncryptedUpload, type EncryptedUpload } from '../Upload';

const getHeightAndWidthFromDataUrl = (dataURL: string): Promise<{ height: number; width: number }> => {
	return new Promise((resolve) => {
		const img = new Image();
		img.onload = () => {
			resolve({
				height: img.height,
				width: img.width,
			});
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

export const processMessageUploads = async (chat: ChatAPI, message: IMessage) => {
	const { tmid, msg } = message;
	const room = await chat.data.getRoom();
	const e2eRoom = await e2e.getInstanceByRoomId(room._id);

	const store = tmid ? chat.threadUploads : chat.uploads;
	const filesToUpload = store.get();

	if (filesToUpload.length === 0) {
		return false;
	}

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
	if (e2eRoom && shouldConvertSentMessages) {
		content = await getEncryptedContent(filesToUpload as EncryptedUpload[], e2eRoom, msg);
	}

	const composedMessage: AtLeast<IMessage, 'msg' | '_id' | 'rid'> = {
		...message,
		tmid,
		msg,
		content,
		...(e2eRoom && {
			t: 'e2e',
			msg: '',
		}),
	} as const;

	try {
		await sdk.call('sendMessage', composedMessage, fileUrls, filesToConfirm);
		store.clear();
	} catch (error: unknown) {
		dispatchToastMessage({ type: 'error', message: error });
	} finally {
		chat.action.stop('uploading');
	}

	return true;
};
