import fs from 'fs';
import type { IncomingMessage } from 'http';
import type { Stream, Transform } from 'stream';
import { Readable } from 'stream';

import { MeteorError, ServiceClassInternal } from '@rocket.chat/core-services';
import type {
	ISendFileLivechatMessageParams,
	ISendFileMessageParams,
	IUploadFileParams,
	IUploadService,
	ParsedUpload,
	ParseUploadOptions,
} from '@rocket.chat/core-services';
import type { IUpload, IUser, FilesAndAttachments } from '@rocket.chat/core-typings';
import { Random } from '@rocket.chat/random';
import busboy from 'busboy';
import ExifTransformer from 'exif-be-gone';

import { FileUpload } from '../../../app/file-upload/server';
import { parseFileIntoMessageAttachments, sendFileMessage } from '../../../app/file-upload/server/methods/sendFileMessage';
import { sendFileLivechatMessage } from '../../../app/livechat/server/methods/sendFileLivechatMessage';
import { getMimeType } from '../../../app/utils/lib/mimeTypes';
import { UploadFS } from '../../ufs';

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

	async cleanupTempFile(tempFilePath: string): Promise<void> {
		try {
			await fs.promises.unlink(tempFilePath);
		} catch (error: any) {
			console.warn(`[UploadService] Failed to cleanup temp file: ${tempFilePath}`, error);
		}
	}

	async stripExifFromFile(filePath: string): Promise<number> {
		const tmpPath = `${filePath}.exif-stripped`;

		try {
			await new Promise<void>((resolve, reject) => {
				const readStream = fs.createReadStream(filePath);
				const writeStream = fs.createWriteStream(tmpPath);
				const exifTransformer = new ExifTransformer();

				readStream.pipe(exifTransformer).pipe(writeStream);

				writeStream.on('finish', () => resolve());
				writeStream.on('error', reject);
				readStream.on('error', reject);
			});

			await fs.promises.rename(tmpPath, filePath);
			const stat = await fs.promises.stat(filePath);
			return stat.size;
		} catch (error) {
			await this.cleanupTempFile(tmpPath);
			throw error;
		}
	}

	async parseUpload(
		requestOrStream: IncomingMessage | Request,
		options: ParseUploadOptions,
	): Promise<{ file: ParsedUpload | null; fields: Record<string, string> }> {
		const limits: busboy.Limits = { files: 1 };
		if (options.maxSize && options.maxSize > 0) {
			// We add an extra byte to the configured limit so we don't fail the upload
			// of a file that is EXACTLY maxSize
			limits.fileSize = options.maxSize + 1;
		}

		const isIncomingMessage = 'socket' in requestOrStream;
		const headers = isIncomingMessage
			? ((requestOrStream as IncomingMessage).headers as Record<string, string>)
			: Object.fromEntries((requestOrStream as Request).headers.entries());

		const bb = busboy({
			headers,
			defParamCharset: 'utf8',
			limits,
		});

		const fields: Record<string, string> = {};
		let parsedFile: ParsedUpload | null = null;
		let busboyFinished = false;
		let writeStreamFinished = options.fileOptional === true;

		const { promise, resolve, reject } = Promise.withResolvers<{
			file: ParsedUpload | null;
			fields: Record<string, string>;
		}>();

		const tryResolve = () => {
			if (busboyFinished && writeStreamFinished) {
				if (!parsedFile && !options.fileOptional) {
					return reject(new MeteorError('error-no-file', 'No file uploaded'));
				}
				resolve({ file: parsedFile, fields });
			}
		};

		bb.on('field', (fieldname: string, value: string) => {
			fields[fieldname] = value;
		});

		bb.on('file', (fieldname, file, info) => {
			const { filename, mimeType } = info;

			writeStreamFinished = false;

			if (options.field && fieldname !== options.field) {
				file.resume();
				return reject(new MeteorError('invalid-field'));
			}

			if (options.allowedMimeTypes && !options.allowedMimeTypes.includes(mimeType)) {
				file.resume();
				return reject(new MeteorError('error-invalid-file-type', `File type ${mimeType} not allowed`));
			}

			const fileId = Random.id();
			const tempFilePath = UploadFS.getTempFilePath(fileId);

			const writeStream = fs.createWriteStream(tempFilePath);

			let currentStream: Stream = file;
			if (options.transforms?.length) {
				for (const transform of options.transforms) {
					currentStream = currentStream.pipe(transform);
				}
			}

			currentStream.pipe(writeStream);

			writeStream.on('finish', () => {
				if (file.truncated) {
					void this.cleanupTempFile(tempFilePath);
					return reject(new MeteorError('error-file-too-large', 'File size exceeds the allowed limit'));
				}

				parsedFile = {
					tempFilePath,
					filename,
					mimetype: getMimeType(mimeType, filename),
					size: writeStream.bytesWritten,
					fieldname,
				};
				writeStreamFinished = true;
				tryResolve();
			});

			writeStream.on('error', (err) => {
				void this.cleanupTempFile(tempFilePath);
				reject(new MeteorError('error-file-upload', err.message));
			});

			file.on('error', (err) => {
				writeStream.destroy();
				void this.cleanupTempFile(tempFilePath);
				reject(err);
			});
		});

		bb.on('finish', () => {
			busboyFinished = true;
			tryResolve();
		});

		bb.on('error', (err: any) => {
			reject(new MeteorError('error-upload-failed', err.message));
		});

		bb.on('filesLimit', () => {
			reject('Just 1 file is allowed');
		});

		bb.on('partsLimit', () => {
			reject(new MeteorError('error-too-many-parts', 'Too many parts in upload'));
		});

		bb.on('fieldsLimit', () => {
			reject(new MeteorError('error-too-many-fields', 'Too many fields in upload'));
		});

		if (isIncomingMessage) {
			(requestOrStream as IncomingMessage).pipe(bb);
		} else {
			const fetchRequest = requestOrStream as Request;
			if (!fetchRequest.body) {
				return Promise.reject(new MeteorError('error-no-body', 'Request has no body'));
			}

			const nodeStream = Readable.fromWeb(fetchRequest.body as any);
			nodeStream.pipe(bb);
		}

		return promise;
	}
}

/**
 * Creates a Transform stream that strips EXIF metadata from images.
 */
export function createExifStripTransform(): Transform {
	return new ExifTransformer();
}
