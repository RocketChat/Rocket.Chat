import type { IMessage, FileAttachmentProps, IE2EEMessage } from '@rocket.chat/core-typings';
import { isRoomFederated } from '@rocket.chat/core-typings';
import { EJSON } from 'meteor/ejson';

import { e2e } from '../../../../app/e2e/client';
import { fileUploadIsValidContentType } from '../../../../app/utils/client';
import FileUploadModal from '../../../views/room/modals/FileUploadModal';
import { imperativeModal } from '../../imperativeModal';
import { prependReplies } from '../../utils/prependReplies';
import type { ChatAPI } from '../ChatAPI';

if ('serviceWorker' in navigator) {
	navigator.serviceWorker
		.register('/enc.js', {
			scope: '/',
		})
		.then((reg) => {
			if (reg.active) console.log('service worker installed');
		})
		.catch((err) => {
			console.log(`registration failed: ${err}`);
		});
}

export const uploadFiles = async (chat: ChatAPI, files: readonly File[], resetFileInput?: () => void): Promise<void> => {
	const replies = chat.composer?.quotedMessages.get() ?? [];

	const msg = await prependReplies('', replies);

	const room = await chat.data.getRoom();

	const queue = [...files];

	const uploadFile = (
		file: File,
		extraData?: Pick<IMessage, 't' | 'e2e'> & { description?: string },
		getContent?: (fileId: string, fileUrl: string) => Promise<IE2EEMessage['content']>,
	) => {
		chat.uploads.send(
			file,
			{
				msg,
				...extraData,
			},
			getContent,
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

					const shouldConvertSentMessages = e2eRoom.shouldConvertSentMessages({ msg });

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
							};

							if (/^image\/.+/.test(file.type)) {
								attachments.push({
									...attachment,
									image_url: fileUrl,
									image_type: file.type,
									image_size: file.size,
								});

								// if (file.identify?.size) {
								// 	attachment.image_dimensions = file.identify.size;
								// }
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
									// format: getFileExtension(file.name),
								});
							}

							const data = new TextEncoder().encode(
								EJSON.stringify({
									attachments,
								}),
							);

							return {
								algorithm: 'rc.v1.aes-sha2',
								ciphertext: await e2eRoom.encryptText(data),
							};
						};

						uploadFile(
							encryptedFile.file,
							{
								t: 'e2e',
							},
							getContent,
						);
					}
				},
				invalidContentType: !(file.type && fileUploadIsValidContentType(file.type)),
			},
		});
	};

	uploadNextFile();
	resetFileInput?.();
};
