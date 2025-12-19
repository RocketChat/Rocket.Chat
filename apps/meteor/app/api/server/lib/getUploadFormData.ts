import { Readable } from 'stream';
import { ReadableStream } from 'stream/web';

import { MeteorError } from '@rocket.chat/core-services';
import type { ValidateFunction } from 'ajv';
import busboy from 'busboy';

import { TempUploadFile } from '../../../../server/ufs/TempUploadFile';
import { getMimeType } from '../../../utils/lib/mimeTypes';

type UploadResultMeta<K> = {
	fieldname: string;
	filename: string;
	encoding: string;
	mimetype: string;
	fields: K;
};

type UploadResult<K> = UploadResultMeta<K> & {
	fileBuffer: Buffer;
	sizeInBytes: number;
};

type UploadResultWithOptionalFile<K> =
	| UploadResult<K>
	| ({
			[P in keyof Omit<UploadResult<K>, 'fields'>]: undefined;
	  } & {
			fields: K;
	  });

type UploadResultStream<K> = UploadResultMeta<K> & {
	readonly tempFile: TempUploadFile;
};

type UploadResultWithOptionalFileStream<K> =
	| UploadResultStream<K>
	| ({
			[P in keyof Omit<UploadResultStream<K>, 'fields'>]: undefined;
	  } & {
			fields: K;
	  });

// Shared implementation for processing form data
async function processUploadFormData<
	T extends string,
	K extends Record<string, string> = Record<string, string>,
	V extends ValidateFunction<K> = ValidateFunction<K>,
	R = UploadResultWithOptionalFile<K> | UploadResultWithOptionalFileStream<K>,
>(
	{ request }: { request: Request },
	options: {
		field?: T;
		validate?: V;
		sizeLimit?: number;
		fileOptional?: boolean;
	},
	fileHandler: (
		fieldname: string,
		file: Readable & { truncated: boolean },
		fileInfo: { filename: string; encoding: string; mimeType: string },
		fields: K,
		reject: (reason?: any) => void,
	) => Promise<R>,
): Promise<R> {
	if (!(request.body instanceof ReadableStream)) {
		return Promise.reject(new MeteorError('Invalid request body'));
	}

	const limits = {
		files: 1,
		...(options.sizeLimit && options.sizeLimit > -1 && { fileSize: options.sizeLimit }),
	};

	const bb = busboy({ headers: Object.fromEntries(request.headers.entries()), defParamCharset: 'utf8', limits });
	const fields = Object.create(null) as K;

	let uploadedFile: R;

	const { promise: resultPromise, resolve, reject } = Promise.withResolvers<R>();

	function onField(fieldname: keyof K, value: K[keyof K]) {
		fields[fieldname] = value;
	}

	function onEnd() {
		if (!uploadedFile) {
			return reject(new MeteorError('No file or fields were uploaded'));
		}
		if (!options.fileOptional && !uploadedFile.fileBuffer && !(uploadedFile as UploadResultWithOptionalFileStream<K>).fileStream) {
			return reject(new MeteorError('No file uploaded'));
		}
		if (options.validate !== undefined && !options.validate(fields)) {
			return reject(new MeteorError(`Invalid fields ${options.validate.errors?.join(', ')}`));
		}
		return resolve(uploadedFile);
	}

	function onFile(
		fieldname: string,
		file: Readable & { truncated: boolean },
		fileInfo: { filename: string; encoding: string; mimeType: string },
	) {
		if (options.field && fieldname !== options.field) {
			file.resume();
			return reject(new MeteorError('invalid-field'));
		}

		fileHandler(fieldname, file, fileInfo, fields, reject)
			.then((file) => {
				uploadedFile = file;
			})
			.catch((err) => {
				reject(err);
			});
	}

	function cleanup() {
		bb.removeAllListeners();
	}

	bb.on('field', onField);
	bb.on('file', onFile);
	bb.on('close', cleanup);
	bb.on('end', onEnd);
	bb.on('finish', onEnd);

	bb.on('error', (err: Error) => {
		reject(err);
	});

	bb.on('partsLimit', () => {
		reject();
	});
	bb.on('filesLimit', () => {
		reject('Just 1 file is allowed');
	});
	bb.on('fieldsLimit', () => {
		reject();
	});

	// Unclear why typescript complains that the ReadableStream from request.body is incompatible here
	Readable.fromWeb(request.body satisfies ReadableStream).pipe(bb);

	return resultPromise;
}

export async function getUploadFormData<
	T extends string,
	K extends Record<string, string> = Record<string, string>,
	V extends ValidateFunction<K> = ValidateFunction<K>,
>(
	{ request }: { request: Request },
	options: {
		field?: T;
		validate?: V;
		sizeLimit?: number;
		fileOptional: true;
	},
): Promise<UploadResultWithOptionalFile<K>>;

export async function getUploadFormData<
	T extends string,
	K extends Record<string, string> = Record<string, string>,
	V extends ValidateFunction<K> = ValidateFunction<K>,
>(
	{ request }: { request: Request },
	options?: {
		field?: T;
		validate?: V;
		sizeLimit?: number;
		fileOptional?: false | undefined;
	},
): Promise<UploadResult<K>>;

export async function getUploadFormData<
	T extends string,
	K extends Record<string, string> = Record<string, string>,
	V extends ValidateFunction<K> = ValidateFunction<K>,
>(
	{ request }: { request: Request },
	options: {
		field?: T;
		validate?: V;
		sizeLimit?: number;
		fileOptional?: boolean;
	} = {},
): Promise<UploadResultWithOptionalFile<K>> {
	return processUploadFormData<T, K, V, UploadResultWithOptionalFile<K>>(
		{ request },
		options,
		async (fieldname, file, { filename, encoding, mimeType: mimetype }, fields, reject) => {
			const fileChunks: Uint8Array[] = [];

			return new Promise<UploadResultWithOptionalFile<K>>((resolveFile) => {
				file.on('data', (chunk) => {
					fileChunks.push(chunk);
				});

				file.on('end', () => {
					if (file.truncated) {
						fileChunks.length = 0;
						reject(new MeteorError('error-file-too-large'));
						return;
					}

					const fileBuffer = Buffer.concat(fileChunks);

					resolveFile({
						filename,
						encoding,
						mimetype: getMimeType(mimetype, filename),
						fieldname,
						fields,
						fileBuffer,
						sizeInBytes: fileBuffer.length,
					});
				});
			});
		},
	);
}

export async function getUploadFormDataStream<
	T extends string,
	K extends Record<string, string> = Record<string, string>,
	V extends ValidateFunction<K> = ValidateFunction<K>,
>(
	{ request }: { request: Request },
	options: {
		field?: T;
		validate?: V;
		sizeLimit?: number;
		fileOptional: true;
	},
): Promise<UploadResultWithOptionalFileStream<K>>;

export async function getUploadFormDataStream<
	T extends string,
	K extends Record<string, string> = Record<string, string>,
	V extends ValidateFunction<K> = ValidateFunction<K>,
>(
	{ request }: { request: Request },
	options?: {
		field?: T;
		validate?: V;
		sizeLimit?: number;
		fileOptional?: false | undefined;
	},
): Promise<UploadResultStream<K>>;

export async function getUploadFormDataStream<
	T extends string,
	K extends Record<string, string> = Record<string, string>,
	V extends ValidateFunction<K> = ValidateFunction<K>,
>(
	{ request }: { request: Request },
	options: {
		field?: T;
		validate?: V;
		sizeLimit?: number;
		fileOptional?: boolean;
	} = {},
): Promise<UploadResultWithOptionalFileStream<K>> {
	return processUploadFormData<T, K, V, UploadResultWithOptionalFileStream<K>>(
		{ request },
		options,
		async (fieldname, file, { filename, encoding, mimeType: mimetype }, fields, reject) => {
			const tempFile = TempUploadFile.create();
			const writeStream = tempFile.getWritableStream();

			return new Promise<UploadResultWithOptionalFileStream<K>>((resolveFile) => {
				file.pipe(writeStream);

				writeStream.once('error', (err) => reject(err));

				file.once('end', () => {
					if (file.truncated) {
						// Clean up temp file on truncation
						tempFile.safeUnlink();
						reject(new MeteorError('error-file-too-large'));
						return;
					}

					writeStream.end(() =>
						resolveFile({
							filename,
							encoding,
							mimetype: getMimeType(mimetype, filename),
							fieldname,
							fields,
							tempFile,
						}),
					);
				});
			});
		},
	);
}
