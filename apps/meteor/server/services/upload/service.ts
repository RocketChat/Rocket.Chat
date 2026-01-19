import { ServiceClassInternal } from '@rocket.chat/core-services';
import type { ISendFileLivechatMessageParams, ISendFileMessageParams, IUploadFileParams, IUploadService } from '@rocket.chat/core-services';
import type { IUpload, IUser, FilesAndAttachments, IMessage } from '@rocket.chat/core-typings';
import { isFileAttachment } from '@rocket.chat/core-typings';

import { FileUpload } from '../../../app/file-upload/server';
import { parseFileIntoMessageAttachments, sendFileMessage } from '../../../app/file-upload/server/methods/sendFileMessage';
import { updateMessage } from '../../../app/lib/server/functions/updateMessage';
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

	async updateMessageRemovingFiles(msg: IMessage, filesToRemove: IUpload['_id'][], user: IUser): Promise<void> {
		const text = `_${i18n.t('File_removed')}_`;
		const newAttachment = { color: '#FD745E', text };

		const newFiles = msg.files?.filter((file) => !filesToRemove.includes(file._id));
		const newAttachments = msg.attachments?.map((attachment) => {
			if (!isFileAttachment(attachment)) {
				return attachment;
			}

			// If the attachment doesn't have a `fileId`, we assume it's an old message with only one file, in which case checking the id is not needed
			if (attachment.fileId && !filesToRemove.includes(attachment.fileId)) {
				return attachment;
			}

			return newAttachment;
		});
		const newFile = msg.file?._id && !filesToRemove.includes(msg.file._id) ? msg.file : newFiles?.[0];

		const editedMessage = {
			...msg,
			files: newFiles,
			attachments: newAttachments,
			file: newFile,
		};

		await updateMessage(editedMessage, user, msg);
	}
}
