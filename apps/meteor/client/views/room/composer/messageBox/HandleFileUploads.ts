import type { IMessage, IUpload, IE2EEMessage, FileAttachmentProps } from '@rocket.chat/core-typings';

import { e2e } from '../../../../../app/e2e/client';
import { getFileExtension } from '../../../../../lib/utils/getFileExtension';
import { prependReplies } from '../../../../lib/utils/prependReplies';

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
const uploadFile = (
	file: File[] | File,
	chat: any,
	extraData?: Pick<IMessage, 't' | 'e2e'> & { msg?: string },
	getContent?: (fileId: string[], fileUrl: string[]) => Promise<IE2EEMessage['content']>,
	fileContent?: { raw: Partial<IUpload>; encrypted?: { algorithm: string; ciphertext: string } | undefined },
	setFilesToUpload?: (files: File[]) => void,
) => {
	if (!chat) {
		console.error('Chat context not found');
		return;
	}
	chat.uploads.send(
		file,
		{
			...extraData,
		},
		getContent,
		fileContent,
	);
	chat.composer?.clear();
	setFilesToUpload?.([]);
};

const handleEncryptedFilesShared = async (
	filesToUpload: File[],
	chat: any,
	msg: string,
	e2eRoom: any,
	setFilesToUpload?: (files: File[]) => void,
) => {
	const encryptedFilesarray: any = await Promise.all(filesToUpload.map((file) => e2eRoom.encryptFile(file)));

	const filesarray = encryptedFilesarray.map((file: any) => file?.file);

	const imgDimensions = await Promise.all(
		filesToUpload.map((file) => {
			if (/^image\/.+/.test(file.type)) {
				return getHeightAndWidthFromDataUrl(window.URL.createObjectURL(file));
			}
			return null;
		}),
	);

	if (encryptedFilesarray[0]) {
		const getContent = async (_id: string[], fileUrl: string[]): Promise<IE2EEMessage['content']> => {
			const attachments = [];
			const arrayoffiles = [];
			for (let i = 0; i < _id.length; i++) {
				const attachment: FileAttachmentProps = {
					title: filesToUpload[i].name,
					type: 'file',
					title_link: fileUrl[i],
					title_link_download: true,
					encryption: {
						key: encryptedFilesarray[i].key,
						iv: encryptedFilesarray[i].iv,
					},
					hashes: {
						sha256: encryptedFilesarray[i].hash,
					},
				};

				if (/^image\/.+/.test(filesToUpload[i].type)) {
					const dimensions = imgDimensions[i];
					attachments.push({
						...attachment,
						image_url: fileUrl[i],
						image_type: filesToUpload[i].type,
						image_size: filesToUpload[i].size,
						...(dimensions && {
							image_dimensions: dimensions,
						}),
					});
				} else if (/^audio\/.+/.test(filesToUpload[i].type)) {
					attachments.push({
						...attachment,
						audio_url: fileUrl[i],
						audio_type: filesToUpload[i].type,
						audio_size: filesToUpload[i].size,
					});
				} else if (/^video\/.+/.test(filesToUpload[i].type)) {
					attachments.push({
						...attachment,
						video_url: fileUrl[i],
						video_type: filesToUpload[i].type,
						video_size: filesToUpload[i].size,
					});
				} else {
					attachments.push({
						...attachment,
						size: filesToUpload[i].size,
						format: getFileExtension(filesToUpload[i].name),
					});
				}

				const files = {
					_id: _id[i],
					name: filesToUpload[i].name,
					type: filesToUpload[i].type,
					size: filesToUpload[i].size,
				};
				arrayoffiles.push(files);
			}

			return e2eRoom.encryptMessageContent({
				attachments,
				files: arrayoffiles,
				file: filesToUpload[0],
				msg,
			});
		};

		const fileContentData = {
			type: filesToUpload[0].type,
			typeGroup: filesToUpload[0].type.split('/')[0],
			name: filesToUpload[0].name,
			encryption: {
				key: encryptedFilesarray[0].key,
				iv: encryptedFilesarray[0].iv,
			},
			hashes: {
				sha256: encryptedFilesarray[0].hash,
			},
		};

		const fileContent = {
			raw: fileContentData,
			encrypted: await e2eRoom.encryptMessageContent(fileContentData),
		};
		uploadFile(
			filesarray,
			chat,
			{
				t: 'e2e',
			},
			getContent,
			fileContent,
			setFilesToUpload,
		);
	}
};
export const handleSendFiles = async (filesToUpload: File[], chat: any, room: any, setFilesToUpload?: (files: File[]) => void) => {
	if (!chat || !room) {
		return;
	}
	const replies = chat.composer?.quotedMessages.get() ?? [];
	const msg = await prependReplies(chat.composer?.text || '', replies);

	filesToUpload.forEach((file) => {
		Object.defineProperty(file, 'name', {
			writable: true,
			value: file.name,
		});
	});

	const e2eRoom = await e2e.getInstanceByRoomId(room._id);

	if (!e2eRoom) {
		uploadFile(filesToUpload, chat, { msg });
		setFilesToUpload?.([]);
		return;
	}

	const shouldConvertSentMessages = await e2eRoom.shouldConvertSentMessages({ msg });

	if (!shouldConvertSentMessages) {
		uploadFile(filesToUpload, chat, { msg });
		setFilesToUpload?.([]);
		return;
	}
	handleEncryptedFilesShared(filesToUpload, chat, msg, e2eRoom, setFilesToUpload);
	chat.composer?.clear();
};
