import type { IMessage, IUpload, IUser } from '@rocket.chat/core-typings';
import { Avatars, Uploads } from '@rocket.chat/models';

import { FileUpload } from '../../../../../../app/file-upload/server';
import { parseFileIntoMessageAttachments } from '../../../../../../app/file-upload/server/methods/sendFileMessage';

interface IAvatarMetadataFile {
	type: string;
	name: string;
}

export class RocketChatFileAdapter {
	public async uploadFile(
		readableStream: ReadableStream,
		internalRoomId: string,
		internalUser: IUser,
		fileRecord: Partial<IUpload>,
	): Promise<{ files: IMessage['files']; attachments: IMessage['attachments'] }> {
		const fileStore = FileUpload.getStore('Uploads');

		const uploadedFile = await fileStore.insert(fileRecord, readableStream);
		const { files, attachments } = await parseFileIntoMessageAttachments(uploadedFile, internalRoomId, internalUser);

		return { files, attachments };
	}

	public async getBufferFromFileRecord(fileRecord: IUpload): Promise<Buffer> {
		const buffer = await FileUpload.getBuffer(fileRecord);
		if (!(buffer instanceof Buffer)) {
			throw new Error('Unknown error');
		}
		return buffer;
	}

	public async getFileRecordById(fileId: string): Promise<IUpload | undefined | null> {
		return Uploads.findOneById(fileId);
	}

	public async extractMetadataFromFile(file: IUpload): Promise<{ height?: number; width?: number; format?: string }> {
		if (file.type?.startsWith('image/')) {
			const metadata = await FileUpload.extractMetadata(file);

			return {
				format: metadata.format,
				height: metadata.height,
				width: metadata.width,
			};
		}
		if (file.type?.startsWith('video/')) {
			return {
				height: 200,
				width: 250,
			};
		}
		return {};
	}

	public async getBufferForAvatarFile(username: string): Promise<any> {
		const file = await Avatars.findOneByName(username);
		if (!file?._id) {
			return;
		}
		return FileUpload.getBuffer(file);
	}

	public async getFileMetadataForAvatarFile(username: string): Promise<IAvatarMetadataFile> {
		const file = (await Avatars.findOneByName(username)) as Record<string, any>;

		return {
			type: file.type,
			name: file.name,
		};
	}
}
