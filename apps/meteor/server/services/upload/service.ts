import { Message, ServiceClassInternal } from '@rocket.chat/core-services';
import type { ISendFileLivechatMessageParams, ISendFileMessageParams, IUploadFileParams, IUploadService } from '@rocket.chat/core-services';
import type { IUpload, IUser, FilesAndAttachments, IMessage } from '@rocket.chat/core-typings';
import { isFileAttachment } from '@rocket.chat/core-typings';
import { Logger } from '@rocket.chat/logger';
import { Uploads } from '@rocket.chat/models';

import { canAccessRoomIdAsync } from '../../../app/authorization/server/functions/canAccessRoom';
import { canDeleteMessageAsync } from '../../../app/authorization/server/functions/canDeleteMessage';
import { FileUpload } from '../../../app/file-upload/server';
import { parseFileIntoMessageAttachments, sendFileMessage } from '../../../app/file-upload/server/methods/sendFileMessage';
import { updateMessage } from '../../../app/lib/server/functions/updateMessage';
import { sendFileLivechatMessage } from '../../../app/livechat/server/methods/sendFileLivechatMessage';

const logger = new Logger('UploadService');

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

	async canDeleteFile(userId: IUser['_id'], file: IUpload, msg: IMessage | null): Promise<boolean> {
		if (msg) {
			return canDeleteMessageAsync(userId, msg);
		}

		if (!file.userId || !file.rid) {
			return false;
		}

		// If file is not confirmed and was sent by the same user
		if (file.expiresAt && file.userId === userId) {
			return canAccessRoomIdAsync(file.rid, userId);
		}

		// It's a confirmed file but it has no message, so use data from the file to run message delete permission checks
		const msgForValidation = { u: { _id: file.userId }, ts: file.uploadedAt, rid: file.rid };
		return canDeleteMessageAsync(userId, msgForValidation);
	}

	async deleteFile(user: IUser, fileId: IUpload['_id'], msg: IMessage | null): Promise<{ deletedFiles: IUpload['_id'][] }> {
		// Find every file that is derived from the file that is being deleted (its thumbnails)
		const additionalFiles = await Uploads.findAllByOriginalFileId(fileId, { projection: { _id: 1 } })
			.map(({ _id }) => _id)
			.toArray();
		const allFiles = [fileId, ...additionalFiles];

		if (msg) {
			await this.updateMessageRemovingFiles(msg, allFiles, user);
		}

		return this.removeFileAndDerivates(fileId, additionalFiles);
	}

	private async removeFileAndDerivates(
		fileId: IUpload['_id'],
		additionalFiles: IUpload['_id'][],
	): Promise<{ deletedFiles: IUpload['_id'][] }> {
		const store = FileUpload.getStore('Uploads');
		// Delete the main file first;
		await store.deleteById(fileId);

		// The main file is already deleted; From here forward we'll return a success response even if some sub-process fails
		const deletedFiles: IUpload['_id'][] = [fileId];
		// Delete them one by one as the store may include requests to external services
		for await (const id of additionalFiles) {
			try {
				await store.deleteById(id);
				deletedFiles.push(id);
			} catch (err) {
				logger.error({ msg: 'Failed to delete derived file', fileId: id, originalFileId: fileId, err });
			}
		}

		return { deletedFiles };
	}

	private async updateMessageRemovingFiles(msg: IMessage, filesToRemove: IUpload['_id'][], user: IUser): Promise<void> {
		const newAttachment = await Message.getNotificationAttachment('File_removed');

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
