import type Stream from 'stream';

import { ServiceClassInternal } from '@rocket.chat/core-services';
import type { ISendFileLivechatMessageParams, ISendFileMessageParams, IUploadFileParams, IUploadService } from '@rocket.chat/core-services';
import type { IUpload, IUser, FilesAndAttachments } from '@rocket.chat/core-typings';
import sharp from 'sharp';

import { FileUpload } from '../../../app/file-upload/server';
import { parseFileIntoMessageAttachments, sendFileMessage } from '../../../app/file-upload/server/methods/sendFileMessage';
import { sendFileLivechatMessage } from '../../../app/livechat/server/methods/sendFileLivechatMessage';

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

	async streamUploadedFile({
		file,
		imageResizeOpts,
	}: {
		file: IUpload;
		imageResizeOpts?: { width: number; height: number };
	}): Promise<Stream.Readable> {
		const stream = await FileUpload.getStore('Uploads')._store.getReadStream(file._id, file);
		if (!stream) {
			throw new Error('File not found');
		}

		if (file?.type?.includes('image') && imageResizeOpts) {
			const { width, height } = imageResizeOpts;
			return stream.pipe(
				sharp()
					.resize({ width, height, fit: 'contain' })
					.on('error', (error) => {
						throw new Error(`Error resizing image: ${error.message}`);
					}),
			);
		}

		return stream;
	}

	async uploadFileFromStream({ streamParam, details }: { streamParam: Stream.Readable; details: any }): Promise<IUpload> {
		return FileUpload.getStore('Uploads').insert(details, streamParam);
	}
}
