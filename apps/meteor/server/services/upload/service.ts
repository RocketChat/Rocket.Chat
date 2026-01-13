import { ServiceClassInternal } from '@rocket.chat/core-services';
import type { ISendFileLivechatMessageParams, ISendFileMessageParams, IUploadFileParams, IUploadService } from '@rocket.chat/core-services';
import type { IUpload, IUser, FilesAndAttachments, IMessage } from '@rocket.chat/core-typings';
import { isFileAttachment } from '@rocket.chat/core-typings';
import { Messages } from '@rocket.chat/models';

import { FileUpload } from '../../../app/file-upload/server';
import { parseFileIntoMessageAttachments, sendFileMessage } from '../../../app/file-upload/server/methods/sendFileMessage';
import { notifyOnMessageChange } from '../../../app/lib/server/lib/notifyListener';
import { sendFileLivechatMessage } from '../../../app/livechat/server/methods/sendFileLivechatMessage';
import { i18n } from '../../lib/i18n';

export class UploadService extends ServiceClassInternal implements IUploadService {
	protected name = 'upload';

	async uploadFile({ buffer, details }: IUploadFileParams): Promise<IUpload> {
		const fileStore = FileUpload.getStore('Uploads');
		return fileStore.insert(details, buffer);
	}

	async sendFileMessage({ roomId, file, userId, message }: ISendFileMessageParams): Promise<boolean | undefined> {
		return sendFileMessage(userId, { roomId, file, msgData: message });
	}

	async sendFileLivechatMessage({ roomId, visitorToken, file, message }: ISendFileLivechatMessageParams): Promise<boolean> {
		return sendFileLivechatMessage({ roomId, visitorToken, file, msgData: message });
	}

	async getFileBuffer({ file }: { file: IUpload }): Promise<Buffer> {
		const buffer = await FileUpload.getBuffer(file);

		if (!(buffer instanceof Buffer)) {
			throw new Error('Unknown error');
		}
		return buffer;
	}

	async extractMetadata(file: IUpload): Promise<{ height?: number; width?: number; format?: string }> {
		return FileUpload.extractMetadata(file);
	}

	async parseFileIntoMessageAttachments(file: Partial<IUpload>, roomId: string, user: IUser): Promise<FilesAndAttachments> {
		return parseFileIntoMessageAttachments(file, roomId, user);
	}

	async updateMessageForDeletedFiles(msg: IMessage, deletedFiles: IUpload['_id'][]): Promise<void> {
		const updateResult = await Messages.removeFilesFromMessage(msg, deletedFiles);

		if (!updateResult.modifiedCount) {
			return;
		}

		try {
			// If the old message has an attachment linking to a deleted file, add a File Removed attachment to it
			if (this.messageHasAttachmentInFileList(msg, deletedFiles)) {
				const text = `_${i18n.t('File_removed')}_`;
				const newAttachment = { color: '#FD745E', text };

				await Messages.addAttachmentsById(msg._id, [newAttachment]);
			}
		} finally {
			setImmediate(async () => {
				void notifyOnMessageChange({
					id: msg._id,
				});
			});
		}
	}

	private messageHasAttachmentInFileList(msg: IMessage, fileList: IUpload['_id'][]): boolean {
		if (!msg.attachments?.length) {
			return false;
		}

		for (const attachment of msg.attachments) {
			if (!isFileAttachment(attachment)) {
				continue;
			}

			// File attachment with no fileId - assume it's an old single-file message
			if (!attachment.fileId) {
				return true;
			}

			if (fileList.includes(attachment.fileId)) {
				return true;
			}
		}

		return false;
	}
}
