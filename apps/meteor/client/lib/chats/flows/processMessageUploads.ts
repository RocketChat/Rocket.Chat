import type { AtLeast, FileAttachmentProps, IMessage, IUploadToConfirm } from '@rocket.chat/core-typings';

import { e2e } from '../../../../app/e2e/client';
import type { E2ERoom } from '../../../../app/e2e/client/rocketchat.e2e.room';
import { sdk } from '../../../../app/utils/client/lib/SDKClient';
import { getFileExtension } from '../../../../lib/utils/getFileExtension';
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

const getEncryptedContent = async (filesToUpload: readonly EncryptedUpload[], e2eRoom: E2ERoom, msg: string) => {
	const attachments = [];
	const arrayOfFiles = [];

	const imgDimensions = await Promise.all(
		filesToUpload.map(({ file }) => {
			if (/^image\/.+/.test(file.type)) {
				return getHeightAndWidthFromDataUrl(window.URL.createObjectURL(file));
			}
			return null;
		}),
	);

	for (let i = 0; i < filesToUpload.length; i++) {
		const attachment: FileAttachmentProps = {
			title: filesToUpload[i].file.name,
			type: 'file',
			title_link: filesToUpload[i].url,
			title_link_download: true,
			encryption: {
				key: filesToUpload[i].encryptedFile.key,
				iv: filesToUpload[i].encryptedFile.iv,
			},
			hashes: {
				sha256: filesToUpload[i].encryptedFile.hash,
			},
		};

		if (/^image\/.+/.test(filesToUpload[i].file.type)) {
			const dimensions = imgDimensions[i];
			attachments.push({
				...attachment,
				image_url: filesToUpload[i].url,
				image_type: filesToUpload[i].file.type,
				image_size: filesToUpload[i].file.size,
				...(dimensions && {
					image_dimensions: dimensions,
				}),
			});
		} else if (/^audio\/.+/.test(filesToUpload[i].file.type)) {
			attachments.push({
				...attachment,
				audio_url: filesToUpload[i].url,
				audio_type: filesToUpload[i].file.type,
				audio_size: filesToUpload[i].file.size,
			});
		} else if (/^video\/.+/.test(filesToUpload[i].file.type)) {
			attachments.push({
				...attachment,
				video_url: filesToUpload[i].url,
				video_type: filesToUpload[i].file.type,
				video_size: filesToUpload[i].file.size,
			});
		} else {
			attachments.push({
				...attachment,
				size: filesToUpload[i].file.size,
				format: getFileExtension(filesToUpload[i].file.name),
			});
		}

		const files = {
			_id: filesToUpload[i].id,
			name: filesToUpload[i].file.name,
			type: filesToUpload[i].file.type,
			size: filesToUpload[i].file.size,
			format: getFileExtension(filesToUpload[i].file.name),
		};

		arrayOfFiles.push(files);
	}

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
