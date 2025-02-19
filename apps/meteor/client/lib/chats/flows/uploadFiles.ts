import type { IMessage, FileAttachmentProps, IE2EEMessage, IUpload } from '@rocket.chat/core-typings';

import { e2e } from '../../../../app/e2e/client';
import { settings } from '../../../../app/settings/client';
import { t } from '../../../../app/utils/lib/i18n';
import { getFileExtension } from '../../../../lib/utils/getFileExtension';
import { MAX_MULTIPLE_UPLOADED_FILES } from '../../constants';
import { dispatchToastMessage } from '../../toast';
import { prependReplies } from '../../utils/prependReplies';
import type { ChatAPI, UploadsAPI } from '../ChatAPI';

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

export const uploadFiles = async (
	chat: ChatAPI,
	{ files, uploadsStore, resetFileInput }: { files: readonly File[]; uploadsStore: UploadsAPI; resetFileInput?: () => void },
): Promise<void> => {
	// TODO: calculate max files based on the new array and the files in the queue
	if (uploadsStore.get().length > MAX_MULTIPLE_UPLOADED_FILES) {
		return dispatchToastMessage({
			type: 'error',
			message: t('You_cant_upload_more_than__count__files', { count: 10 }),
		});
	}

	const replies = chat.composer?.quotedMessages.get() ?? [];

	const msg = await prependReplies('', replies);

	const room = await chat.data.getRoom();

	const queue = [...files];

	const uploadFile = (
		file: File,
		extraData?: Pick<IMessage, 't' | 'e2e'> & { description?: string },
		getContent?: (fileId: string[], fileUrl: string[]) => Promise<IE2EEMessage['content']>,
		fileContent?: { raw: Partial<IUpload>; encrypted: IE2EEMessage['content'] },
	) => {
		uploadsStore.send(
			file,
			{
				msg,
				...extraData,
			},
			getContent,
			fileContent,
		);

		uploadNextFile();
	};

	const submitToUpload = async (file: File, fileName: string): Promise<void> => {
		Object.defineProperty(file, 'name', {
			writable: true,
			value: fileName,
		});

		// encrypt attachment description
		const e2eRoom = await e2e.getInstanceByRoomId(room._id);

		if (!e2eRoom) {
			uploadFile(file);
			return;
		}

		if (!settings.get('E2E_Enable_Encrypt_Files')) {
			uploadFile(file);
			return;
		}

		const shouldConvertSentMessages = await e2eRoom.shouldConvertSentMessages({ msg });

		if (!shouldConvertSentMessages) {
			uploadFile(file);
			return;
		}

		const encryptedFile = await e2eRoom.encryptFile(file);

		if (encryptedFile) {
			const getContent = async (filesId: string[], filesUrl: string[]): Promise<IE2EEMessage['content']> => {
				const attachments = [];
				const _id = filesId[0];
				const fileUrl = filesUrl[0];

				const attachment: FileAttachmentProps = {
					title: file.name,
					type: 'file',
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
						format: getFileExtension(file.name),
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
	};

	const uploadNextFile = (): void => {
		const file = queue.pop();
		if (!file) {
			chat.composer?.dismissAllQuotedMessages();
			return;
		}

		submitToUpload(file, file.name);
	};

	uploadNextFile();
	resetFileInput?.();
};
