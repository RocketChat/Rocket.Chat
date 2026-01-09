import fs from 'fs';
import type { IncomingMessage } from 'http';
import type { Stream, Transform } from 'stream';
import { Readable } from 'stream';
import { pipeline } from 'stream/promises';

import { MeteorError } from '@rocket.chat/core-services';
import { Random } from '@rocket.chat/random';
import busboy from 'busboy';
import ExifTransformer from 'exif-be-gone';

import { UploadFS } from '../../../../server/ufs';
import { getMimeType } from '../../../utils/lib/mimeTypes';

export type ParsedUpload = {
	tempFilePath: string;
	filename: string;
	mimetype: string;
	size: number;
	fieldname: string;
};

export type ParseOptions = {
	field: string;
	maxSize?: number;
	allowedMimeTypes?: string[];
	transforms?: Transform[]; // Optional transform pipeline (e.g., EXIF stripping)
	fileOptional?: boolean;
};

export class UploadService {
	static transforms = {
		stripExif(): Transform {
			return new ExifTransformer();
		},
	};

	static async cleanup(tempFilePath: string): Promise<void> {
		try {
			await fs.promises.unlink(tempFilePath);
		} catch (error: any) {
			console.warn(`[UploadService] Failed to cleanup temp file: ${tempFilePath}`, error);
		}
	}

	static async stripExifFromFile(tempFilePath: string): Promise<number> {
		const strippedPath = `${tempFilePath}.stripped`;

		try {
			const writeStream = fs.createWriteStream(strippedPath);

			await pipeline(fs.createReadStream(tempFilePath), new ExifTransformer(), writeStream);

			await fs.promises.rename(strippedPath, tempFilePath);

			return writeStream.bytesWritten;
		} catch (error) {
			void this.cleanup(strippedPath);

			throw error;
		}
	}

	static async parse(
		requestOrStream: IncomingMessage | Request,
		options: ParseOptions,
	): Promise<{ file: ParsedUpload | null; fields: Record<string, string> }> {
		const limits: any = { files: 1 };
		if (options.maxSize && options.maxSize > 0) {
			limits.fileSize = options.maxSize;
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

		const cleanupTempFile = (tempFilePath: string) => {
			fs.unlink(tempFilePath, (err) => {
				if (err) {
					console.error(`[UploadService] Failed to cleanup temp file: ${tempFilePath}`, err);
				}
			});
		};

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
					cleanupTempFile(tempFilePath);
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
				cleanupTempFile(tempFilePath);
				reject(new MeteorError('error-file-upload', err.message));
			});

			file.on('error', (err) => {
				writeStream.destroy();
				cleanupTempFile(tempFilePath);
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
