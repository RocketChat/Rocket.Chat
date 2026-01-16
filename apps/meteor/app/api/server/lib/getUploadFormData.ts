import { Readable } from 'stream';
import { ReadableStream } from 'stream/web';

import { MeteorError } from '@rocket.chat/core-services';
import type { ValidateFunction } from 'ajv';
import busboy from 'busboy';

import { getMimeType } from '../../../utils/lib/mimeTypes';

type UploadResult<K> = {
	file: Readable & { truncated: boolean };
	fieldname: string;
	filename: string;
	encoding: string;
	mimetype: string;
	fileBuffer: Buffer;
	fields: K;
};

type UploadResultWithOptionalFile<K> =
	| UploadResult<K>
	| ({
			[P in keyof Omit<UploadResult<K>, 'fields'>]: undefined;
	  } & {
			fields: K;
	  });

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
	if (!(request.body instanceof ReadableStream)) {
		return Promise.reject(new MeteorError('Invalid request body'));
	}

	const limits = {
		files: 1,
		...(options.sizeLimit && options.sizeLimit > -1 && { fileSize: options.sizeLimit }),
	};

	const bb = busboy({ headers: Object.fromEntries(request.headers.entries()), defParamCharset: 'utf8', limits });
	const fields = Object.create(null) as K;

	let uploadedFile: UploadResultWithOptionalFile<K> | undefined = {
		fields,
		encoding: undefined,
		filename: undefined,
		fieldname: undefined,
		mimetype: undefined,
		fileBuffer: undefined,
		file: undefined,
	};

	const { promise: resultPromise, resolve, reject } = Promise.withResolvers<UploadResultWithOptionalFile<K>>();

	function onField(fieldname: keyof K, value: K[keyof K]) {
		fields[fieldname] = value;
	}

	function onEnd() {
		if (!uploadedFile) {
			return reject(new MeteorError('No file or fields were uploaded'));
		}
		if (!options.fileOptional && !uploadedFile?.file) {
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
		{ filename, encoding, mimeType: mimetype }: { filename: string; encoding: string; mimeType: string },
	) {
		if (options.field && fieldname !== options.field) {
			file.resume();
			return reject(new MeteorError('invalid-field'));
		}

		const fileChunks: Uint8Array[] = [];
		file.on('data', (chunk) => {
			fileChunks.push(chunk);
		});

		file.on('end', () => {
			if (file.truncated) {
				fileChunks.length = 0;
				return reject(new MeteorError('error-file-too-large'));
			}

			uploadedFile = {
				file,
				filename,
				encoding,
				mimetype: getMimeType(mimetype, filename),
				fieldname,
				fields,
				fileBuffer: Buffer.concat(fileChunks),
			};
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
	Readable.fromWeb(request.body satisfies ReadableStream)
		.on('error', (err) => reject(err))
		.pipe(bb);

	return resultPromise;
}
