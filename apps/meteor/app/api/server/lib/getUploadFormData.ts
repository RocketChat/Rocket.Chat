import type { Readable } from 'stream';

import type { Request } from 'express';
import busboy from 'busboy';
import type { ValidateFunction } from 'ajv';

import { MeteorError } from '../../../../server/sdk/errors';

type UploadResult<K> = {
	file: Readable & { truncated: boolean };
	fieldname: string;
	filename: string;
	encoding: string;
	mimetype: string;
	fileBuffer: Buffer;
	fields: K;
};

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
	} = {},
): Promise<UploadResult<K>> {
	const limits = {
		files: 1,
		...(options.sizeLimit && options.sizeLimit > -1 && { fileSize: options.sizeLimit }),
	};

	const bb = busboy({ headers: request.headers, defParamCharset: 'utf8', limits });
	const fields = Object.create(null) as K;

	let uploadedFile: UploadResult<K> | undefined;

	let returnResult = (_value: UploadResult<K>) => {
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
		file.on('data', function (chunk) {
			fileChunks.push(chunk);
		});

		file.on('end', function () {
			if (file.truncated) {
				fileChunks.length = 0;
				return returnError(new MeteorError('error-file-too-large'));
			}

			uploadedFile = {
				file,
				filename,
				encoding,
				mimetype,
				fieldname,
				fields,
				fileBuffer: Buffer.concat(fileChunks),
			};
		});
	}

	function cleanup() {
		request.unpipe(bb);
		request.on('readable', request.read.bind(request));
		bb.removeAllListeners();
	}

	bb.on('field', onField);
	bb.on('file', onFile);
	bb.on('close', cleanup);
	bb.on('end', onEnd);
	bb.on('finish', onEnd);

	bb.on('error', function (err: Error) {
		returnError(err);
	});

	bb.on('partsLimit', function () {
		returnError();
	});
	bb.on('filesLimit', function () {
		returnError('Just 1 file is allowed');
	});
	bb.on('fieldsLimit', function () {
		returnError();
	});

	request.pipe(bb);

	return new Promise((resolve, reject) => {
		returnResult = resolve;
		returnError = reject;
	});
}
