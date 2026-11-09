import fs from 'node:fs';
import { IncomingMessage } from 'node:http';
import type { Transform } from 'node:stream';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';

import { ClientSafeError } from '@rocket.chat/core-services';
import { Random } from '@rocket.chat/random';
import busboy, { type BusboyConfig } from 'busboy';
import ExifTransformer from 'exif-be-gone';

import { getMimeType } from '../../../lib/mimeTypes';
import { UploadFS } from '../../ufs';

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

type DestroyableStream = {
	destroy(error?: Error): unknown;
};

export class MultipartUploadHandler {
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

	static async parseRequest(
		request: IncomingMessage | Request,
		options: ParseOptions,
	): Promise<{ file: ParsedUpload | null; fields: Record<string, string> }> {
		const limits: BusboyConfig['limits'] = { files: 1 };

		if (options.maxSize && options.maxSize > 0) {
			// We add an extra byte to the configured limit so we don't fail the upload
			// of a file that is EXACTLY maxSize
			limits.fileSize = options.maxSize + 1;
		}

		const headers =
			request instanceof IncomingMessage ? (request.headers as Record<string, string>) : Object.fromEntries(request.headers.entries());

		const bb = busboy({
			headers,
			defParamCharset: 'utf8',
			limits,
		});

		const fields: Record<string, string> = {};
		const tempFilePaths = new Set<string>();
		const activeStreams = new Set<DestroyableStream>();
		const uploadTasks: Promise<void>[] = [];

		let parsedFile: ParsedUpload | null = null;
		let busboyFinished = false;
		let filePendingCount = 0;
		let settled = false;
		let requestStream: DestroyableStream | undefined;

		const { promise, resolve, reject } = Promise.withResolvers<{
			file: ParsedUpload | null;
			fields: Record<string, string>;
		}>();

		const fail = async (error: Error, currentTask?: Promise<void>): Promise<void> => {
			if (settled) {
				return;
			}

			settled = true;

			bb.destroy();

			if (request instanceof IncomingMessage) {
				request.unpipe(bb);
				request.resume();
			}

			requestStream?.destroy();

			for (const stream of activeStreams) {
				stream.destroy();
			}

			// Do not wait for the task that called fail(), otherwise it waits for itself.
			await Promise.allSettled(uploadTasks.filter((task) => task !== currentTask));

			await Promise.all([...tempFilePaths].map((tempFilePath) => this.cleanup(tempFilePath)));

			reject(error);
		};

		const tryResolve = (): void => {
			if (settled || !busboyFinished || filePendingCount > 0) {
				return;
			}

			if (!parsedFile && !options.fileOptional) {
				void fail(new ClientSafeError('error-no-file', 'No file uploaded'));
				return;
			}

			settled = true;
			resolve({ file: parsedFile, fields });
		};

		bb.on('field', (fieldname: string, value: string) => {
			fields[fieldname] = value;
		});

		bb.on('file', (fieldname, file, info) => {
			const { filename, mimeType } = info;

			++filePendingCount;
			activeStreams.add(file);

			file.on('error', (error: Error) => {
				void fail(new ClientSafeError('error-file-upload', error.message));
			});

			if (options.field && fieldname !== options.field) {
				void fail(new ClientSafeError('invalid-field'));
				return;
			}

			if (options.allowedMimeTypes && !options.allowedMimeTypes.includes(mimeType)) {
				void fail(new ClientSafeError('error-invalid-file-type', `File type ${mimeType} not allowed`));
				return;
			}
			const tempFilePath = UploadFS.getTempFilePath(Random.id());

			tempFilePaths.add(tempFilePath);

			let writeStream: fs.WriteStream;

			try {
				writeStream = fs.createWriteStream(tempFilePath);
			} catch (error) {
				const message = error instanceof Error ? error.message : String(error);

				void fail(new ClientSafeError('error-file-upload', message));
				return;
			}

			activeStreams.add(writeStream);

			const transforms = options.transforms ?? [];

			for (const transform of transforms) {
				activeStreams.add(transform);
			}

			const uploadTaskRef: { current?: Promise<void> } = {};

			const uploadTask = pipeline([file, ...transforms, writeStream])
				.then(() => {
					if (settled) {
						return;
					}

					if (file.truncated) {
						throw new ClientSafeError('error-file-too-large', 'File size exceeds the allowed limit');
					}

					parsedFile = {
						tempFilePath,
						filename,
						mimetype: getMimeType(mimeType, filename),
						size: writeStream.bytesWritten,
						fieldname,
					};
				})
				.catch((error: Error) => {
					void fail(
						error instanceof ClientSafeError ? error : new ClientSafeError('error-file-upload', error.message),
						uploadTaskRef.current,
					);
				})
				.finally(() => {
					activeStreams.delete(file);
					activeStreams.delete(writeStream);

					for (const transform of transforms) {
						activeStreams.delete(transform);
					}

					--filePendingCount;
					tryResolve();
				});

			uploadTaskRef.current = uploadTask;
			uploadTasks.push(uploadTask);
		});

		bb.on('finish', () => {
			busboyFinished = true;
			tryResolve();
		});

		bb.on('error', (error: Error) => {
			void fail(new ClientSafeError('error-upload-failed', error.message));
		});

		bb.on('filesLimit', () => {
			void fail(new ClientSafeError('error-too-many-files', 'Too many files in upload'));
		});

		bb.on('partsLimit', () => {
			void fail(new ClientSafeError('error-too-many-parts', 'Too many parts in upload'));
		});

		bb.on('fieldsLimit', () => {
			void fail(new ClientSafeError('error-too-many-fields', 'Too many fields in upload'));
		});

		if (request instanceof IncomingMessage) {
			request.pipe(bb);
		} else {
			if (!request.body) {
				return Promise.reject(new ClientSafeError('error-no-body', 'Request has no body'));
			}

			const nodeStream = Readable.fromWeb(request.body as any);

			requestStream = nodeStream;
			activeStreams.add(nodeStream);

			nodeStream.on('error', (error: Error) => {
				void fail(new ClientSafeError('error-upload-failed', error.message));
			});

			nodeStream.on('close', () => {
				if (!nodeStream.readableEnded && !settled) {
					void fail(new ClientSafeError('error-upload-failed', 'Request body stream closed unexpectedly'));
				}
			});

			nodeStream.pipe(bb);
		}

		return promise;
	}
}
