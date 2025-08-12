import crypto from 'crypto';

import type { IMessage, IUpload, IUser, MessageAttachment, FileAttachmentProps } from '@rocket.chat/core-typings';
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

	/**
	 * Create a reference to a remote Matrix file without downloading it
	 * This creates a file record that points to the remote MXC URI
	 */
	public async createRemoteFileReference(
		mxcUri: string,
		internalRoomId: string,
		internalUser: IUser,
		fileDetails: {
			name: string;
			size: number;
			type: string;
		},
	): Promise<{ files: IMessage['files']; attachments: IMessage['attachments'] }> {
		// Parse MXC URI to get server and media ID
		const mxcMatch = mxcUri.match(/^mxc:\/\/([^/]+)\/(.+)$/);
		if (!mxcMatch) {
			throw new Error('Invalid MXC URI');
		}
		const [, serverName, mediaId] = mxcMatch;

		const pseudoId = `matrix_remote_${crypto.randomBytes(16).toString('hex')}`;

		const fileRecord: Partial<IUpload> = {
			_id: pseudoId,
			name: fileDetails.name || 'unnamed',
			size: fileDetails.size || 0,
			type: fileDetails.type || 'application/octet-stream',
			rid: internalRoomId,
			userId: internalUser._id,
			store: 'MatrixRemote',
			complete: true,
			uploading: false,
			progress: 1,
			extension: this.getFileExtension(fileDetails.name),
			uploadedAt: new Date(),
			federation: {
				type: 'matrix',
				mxcUri,
				isRemote: true,
				serverName,
				mediaId,
			} as any,
		};

		await Uploads.insertOne(fileRecord as IUpload);

		const files: IMessage['files'] = [
			{
				_id: pseudoId,
				name: fileDetails.name || '',
				type: fileDetails.type || 'file',
				size: fileDetails.size || 0,
				format: '',
			},
		];

		const attachments: MessageAttachment[] = [];

		const fileUrl = `/file-upload/${pseudoId}/${encodeURI(fileDetails.name || '')}`;

		if (/^image\/.+/.test(fileDetails.type)) {
			const attachment: FileAttachmentProps = {
				title: fileDetails.name,
				type: 'file',
				title_link: fileUrl,
				title_link_download: true,
				image_url: fileUrl,
				image_type: fileDetails.type,
				image_size: fileDetails.size,
				// Mark as remote for UI handling
				remote: true,
			} as any;
			attachments.push(attachment);
		} else if (/^audio\/.+/.test(fileDetails.type)) {
			attachments.push({
				title: fileDetails.name,
				type: 'file',
				title_link: fileUrl,
				title_link_download: true,
				audio_url: fileUrl,
				audio_type: fileDetails.type,
				audio_size: fileDetails.size,
				remote: true,
			} as any);
		} else if (/^video\/.+/.test(fileDetails.type)) {
			attachments.push({
				title: fileDetails.name,
				type: 'file',
				title_link: fileUrl,
				title_link_download: true,
				video_url: fileUrl,
				video_type: fileDetails.type,
				video_size: fileDetails.size,
				remote: true,
			} as any);
		} else {
			attachments.push({
				title: fileDetails.name,
				type: 'file',
				title_link: fileUrl,
				title_link_download: true,
				size: fileDetails.size,
				format: this.getFileExtension(fileDetails.name),
				remote: true,
			} as any);
		}

		return { files, attachments };
	}

	private getFileExtension(fileName: string): string {
		if (!fileName) return '';
		const lastDotIndex = fileName.lastIndexOf('.');
		if (lastDotIndex === -1) {
			return '';
		}
		return fileName.substring(lastDotIndex + 1).toLowerCase();
	}

	public async getBufferFromFileRecord(fileRecord: IUpload): Promise<Buffer> {
		if ((fileRecord as any).federation?.isRemote) {
			throw new Error('Cannot get buffer for remote Matrix file - should be proxied instead');
		}

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
		if ((file as any).federation?.isRemote) {
			return {};
		}

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
