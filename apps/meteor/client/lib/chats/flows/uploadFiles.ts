import type { IMessage, FileAttachmentProps, IE2EEMessage, IUpload } from '@rocket.chat/core-typings';
import { isRoomFederated } from '@rocket.chat/core-typings';

import { e2e } from '../../../../app/e2e/client';
import { fileUploadIsValidContentType } from '../../../../app/utils/client';
import { getFileExtension } from '../../../../lib/utils/getFileExtension';
import FileUploadModal from '../../../views/room/modals/FileUploadModal';
import { imperativeModal } from '../../imperativeModal';
import { prependReplies } from '../../utils/prependReplies';
import type { ChatAPI } from '../ChatAPI';

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

export const uploadFiles = async (chat: ChatAPI, files: readonly File[], resetFileInput?: () => void): Promise<void> => {
	const replies = chat.composer?.quotedMessages.get() ?? [];

	const msg = await prependReplies('', replies);

	const room = await chat.data.getRoom();

	const queue = [...files];

	function updateQueue(finalFiles: File[]) {
		queue.length = 0;
		finalFiles.forEach((file) => {
			queue.push(file);
		});
	}

	const uploadFile = (
		file: File[] | File,
		extraData?: Pick<IMessage, 't' | 'e2e'> & { description?: string },
		getContent?: (fileId: string[], fileUrl: string[]) => Promise<IE2EEMessage['content']>,
		fileContent?: { raw: Partial<IUpload>; encrypted?: { algorithm: string; ciphertext: string } | undefined },
	) => {
		chat.uploads.send(
			file,
			{
				msg,
				...extraData,
			},
			getContent,
			fileContent,
		);
		chat.composer?.clear();
		imperativeModal.close();
	};
	const uploadNextFile = (): void => {
		const file = queue[0];
		if (!file) {
			chat.composer?.dismissAllQuotedMessages();
			return;
		}

		imperativeModal.open({
			component: FileUploadModal,
			props: {
				file,
				queue,
				updateQueue,
				fileName: file.name,
				fileDescription: chat.composer?.text ?? '',
				showDescription: room && !isRoomFederated(room),
				onClose: (): void => {
					imperativeModal.close();
				},
				// onSubmit: async (fileName: string, description?: string): Promise<void> => {
				onSubmit: async (fileName: string, msg?: string): Promise<void> => {
					Object.defineProperty(file, 'name', {
						writable: true,
						value: fileName,
					});

					const e2eRoom = await e2e.getInstanceByRoomId(room._id);

					if (!e2eRoom) {
						uploadFile(queue, { msg });
						return;
					}

					const shouldConvertSentMessages = await e2eRoom.shouldConvertSentMessages({ msg });

					if (!shouldConvertSentMessages) {
						uploadFile(queue, { msg });
						return;
					}
					console.log('uploading file', file);
					console.log('message ', msg);
					const encryptedFilesarray: any = await Promise.all(
						queue.map(async (file) => {
							return await e2eRoom.encryptFile(file);
						}),
					);
					console.log('encryptedFilesarray', encryptedFilesarray);
					const filesarray = encryptedFilesarray.map((file: any) => {
						return file?.file;
					});
					console.log('filesarray', filesarray);
					if (encryptedFilesarray[0]) {
						const getContent = async (_id: string[], fileUrl: string[]): Promise<IE2EEMessage['content']> => {
							const attachments = [];
							const arrayoffiles = [];
							for (let i = 0; i < _id.length; i++) {
								const attachment: FileAttachmentProps = {
									title: queue[i].name,
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

								if (/^image\/.+/.test(queue[i].type)) {
									const dimensions = await getHeightAndWidthFromDataUrl(window.URL.createObjectURL(queue[i]));

									attachments.push({
										...attachment,
										image_url: fileUrl[i],
										image_type: queue[i].type,
										image_size: queue[i].size,
										...(dimensions && {
											image_dimensions: dimensions,
										}),
									});
								} else if (/^audio\/.+/.test(queue[i].type)) {
									attachments.push({
										...attachment,
										audio_url: fileUrl[i],
										audio_type: queue[i].type,
										audio_size: queue[i].size,
									});
								} else if (/^video\/.+/.test(queue[i].type)) {
									attachments.push({
										...attachment,
										video_url: fileUrl[i],
										video_type: queue[i].type,
										video_size: queue[i].size,
									});
								} else {
									attachments.push({
										...attachment,
										size: queue[i].size,
										format: getFileExtension(queue[i].name),
									});
								}
								

								const files = {
									_id: _id[i],
									name: queue[i].name,
									type: queue[i].type,
									size: queue[i].size,
									// "format": "png"
								};
								arrayoffiles.push(files);
							}

							return e2eRoom.encryptMessageContent({
								attachments,
								files: arrayoffiles,
								file: files[0],
							});
						};

						const fileContentData = {
							type: queue[0].type,
							typeGroup: queue[0].type.split('/')[0],
							name: fileName,
							msg: msg || '',
							encryption: {
								key: encryptedFilesarray[0].key,
								iv: encryptedFilesarray[0].iv,
							},
							hashes: {
								sha256: encryptedFilesarray[0].hash,
							},
						};

						const fileContent = await e2eRoom.encryptMessageContent(fileContentData);

						uploadFile(
							filesarray,
							{
								t: 'e2e',
							},
							getContent,
							fileContent,
						);
					}
				},
				invalidContentType: !fileUploadIsValidContentType(file?.type),
			},
		});
	};

	uploadNextFile();
	resetFileInput?.();
};
