import { Readable } from 'stream';

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

	let returnResult = (_value: UploadResultWithOptionalFile<K>) => {
		// noop
	};
	let returnError = (_error?: Error | string | null | undefined) => {
		// noop
	};

	function onField(fieldname: keyof K, value: K[keyof K]) {
		fields[fieldname] = value;
	}

	function onEnd() {
		if (!uploadedFile) {
			return returnError(new MeteorError('No file or fields were uploaded'));
		}
		if (!options.fileOptional && !uploadedFile?.file) {
			return returnError(new MeteorError('No file uploaded'));
		}
		if (options.validate !== undefined && !options.validate(fields)) {
			return returnError(new MeteorError(`Invalid fields ${options.validate.errors?.join(', ')}`));
		}
		return returnResult(uploadedFile);
	}

	function onFile(
		fieldname: string,
		file: Readable & { truncated: boolean },
		{ filename, encoding, mimeType: mimetype }: { filename: string; encoding: string; mimeType: string },
	) {
		if (options.field && fieldname !== options.field) {
			file.resume();
			return returnError(new MeteorError('invalid-field'));
		}

		const fileChunks: Uint8Array[] = [];
		file.on('data', (chunk) => {
			fileChunks.push(chunk);
		});

		file.on('end', () => {
			if (file.truncated) {
				fileChunks.length = 0;
				return returnError(new MeteorError('error-file-too-large'));
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
		returnError(err);
	});

	bb.on('partsLimit', () => {
		returnError();
	});
	bb.on('filesLimit', () => {
		returnError('Just 1 file is allowed');
	});
	bb.on('fieldsLimit', () => {
		returnError();
	});

	const webReadableStream = await request.blob().then((blob) => blob.stream());

	const nodeReadableStream = new Readable({
		async read() {
			const reader = webReadableStream.getReader();
			try {
				const processChunk = async () => {
					const { done, value } = await reader.read();
					if (done) {
						this.push(null);
						return;
					}
					this.push(Buffer.from(value));
					await processChunk();
				};
				await processChunk();
			} catch (err: any) {
				this.destroy(err);
			}
		},
	});

	nodeReadableStream.pipe(bb);

	return new Promise<UploadResultWithOptionalFile<K>>((resolve, reject) => {
		returnResult = resolve;
		returnError = reject;
	});
}
