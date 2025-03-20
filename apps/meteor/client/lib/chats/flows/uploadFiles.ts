import type { IMessage, FileAttachmentProps, IE2EEMessage, IUpload } from '@rocket.chat/core-typings';
import { isRoomFederated } from '@rocket.chat/core-typings';

import { e2e } from '../../../../app/e2e/client';
import { settings } from '../../../../app/settings/client';
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

	const uploadFile = (
		file: File,
		extraData?: Pick<IMessage, 't' | 'e2e'> & { description?: string },
		getContent?: (fileId: string, fileUrl: string) => Promise<IE2EEMessage['content']>,
		fileContent?: { raw: Partial<IUpload>; encrypted: IE2EEMessage['content'] },
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
		uploadNextFile();
	};

	const uploadNextFile = (): void => {
		const file = queue.pop();
		if (!file) {
			chat.composer?.dismissAllQuotedMessages();
			return;
		}

		imperativeModal.open({
			component: FileUploadModal,
			props: {
				file,
				fileName: file.name,
				fileDescription: chat.composer?.text ?? '',
				showDescription: room && !isRoomFederated(room),
				onClose: (): void => {
					imperativeModal.close();
					uploadNextFile();
				},
				onSubmit: async (fileName: string, description?: string): Promise<void> => {
					Object.defineProperty(file, 'name', {
						writable: true,
						value: fileName,
					});

					// encrypt attachment description
					const e2eRoom = await e2e.getInstanceByRoomId(room._id);

					if (!e2eRoom) {
						uploadFile(file, { description });
						return;
					}

					if (!settings.get('E2E_Enable_Encrypt_Files')) {
						uploadFile(file, { description });
						return;
					}

					const shouldConvertSentMessages = await e2eRoom.shouldConvertSentMessages({ msg });

					if (!shouldConvertSentMessages) {
						uploadFile(file, { description });
						return;
					}

					const encryptedFile = await e2eRoom.encryptFile(file);

					if (encryptedFile) {
						const getContent = async (_id: string, fileUrl: string): Promise<IE2EEMessage['content']> => {
							const attachments = [];

							const attachment: FileAttachmentProps = {
								title: file.name,
								type: 'file',
								description,
								title_link: fileUrl,
								title_link_download: true,
								encryption: {
									key: encryptedFile.key,
									iv: encryptedFile.iv,
								},
								hashes: {
									sha256: encryptedFile.hash,
								},
							};

							if (/^image\/.+/.test(file.type)) {
								const dimensions = await getHeightAndWidthFromDataUrl(window.URL.createObjectURL(file));

								attachments.push({
									...attachment,
									image_url: fileUrl,
									image_type: file.type,
									image_size: file.size,
									...(dimensions && {
										image_dimensions: dimensions,
									}),
								});
							} else if (/^audio\/.+/.test(file.type)) {
								attachments.push({
									...attachment,
									audio_url: fileUrl,
									audio_type: file.type,
									audio_size: file.size,
								});
							} else if (/^video\/.+/.test(file.type)) {
								attachments.push({
									...attachment,
									video_url: fileUrl,
									video_type: file.type,
									video_size: file.size,
								});
							} else {
								attachments.push({
									...attachment,
									size: file.size,
									format: getFileExtension(file.name),
								});
							}

							const files = [
								{
									_id,
									name: file.name,
									type: file.type,
									size: file.size,
									// "format": "png"
								},
							] as IMessage['files'];

							return e2eRoom.encryptMessageContent({
								attachments,
								files,
								file: files?.[0],
							});
						};

						const fileContentData = {
							type: file.type,
							typeGroup: file.type.split('/')[0],
							name: fileName,
							encryption: {
								key: encryptedFile.key,
								iv: encryptedFile.iv,
							},
							hashes: {
								sha256: encryptedFile.hash,
							},
						};

						const fileContent = {
							raw: fileContentData,
							encrypted: await e2eRoom.encryptMessageContent(fileContentData),
						};

						uploadFile(
							encryptedFile.file,
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
