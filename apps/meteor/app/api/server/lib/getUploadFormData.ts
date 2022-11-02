import type { Readable } from 'stream';

import { Meteor } from 'meteor/meteor';
import type { Request } from 'express';
import busboy from 'busboy';
import type { ValidateFunction } from 'ajv';

type UploadResult = {
	file: Readable;
	filename: string;
	encoding: string;
	mimetype: string;
	fileBuffer: Buffer;
	chunk?: { unit: string; start: number; end: number; size: number };
};

export const getUploadFormData = async <
	T extends string,
	K extends Record<string, string> = Record<string, string>,
	V extends ValidateFunction<K> = ValidateFunction<K>,
>(
	{ request }: { request: Request },
	options: {
		field?: T;
		validate?: V;
	} = {},
): Promise<[UploadResult, K, T]> =>
	new Promise((resolve, reject) => {
		const bb = busboy({ headers: request.headers, defParamCharset: 'utf8' });
		const fields = Object.create(null) as K;

		let uploadedFile: UploadResult | undefined;

		let assetName: T | undefined;

		// Check if this is a chunked-upload
		const contentRangeRegExp = new RegExp(/^(bytes) ((\d+)-(\d+)|\*)\/(\d+)$/);
		const isChunked = typeof request.headers['content-range'] === 'string';

		if (isChunked && !contentRangeRegExp.exec(<string>request.headers['content-range'])) {
			reject('invalid content-range given');
		}

		bb.on(
			'file',
			(
				fieldname: string,
				file: Readable,
				{ filename, encoding, mimeType: mimetype }: { filename: string; encoding: string; mimeType: string },
			) => {
				const fileData: Uint8Array[] = [];

				file.on('data', (data: any) => fileData.push(data));

				file.on('end', () => {
					if (uploadedFile) {
						return reject('Just 1 file is allowed');
					}
					if (options.field && fieldname !== options.field) {
						return reject(new Meteor.Error('invalid-field'));
					}
					uploadedFile = {
						file,
						filename,
						encoding,
						mimetype,
						fileBuffer: Buffer.concat(fileData),
					};

					assetName = fieldname as T;
				});
			},
		);

		bb.on('field', (fieldname: keyof K, value: K[keyof K]) => {
			fields[fieldname] = value;
		});

		bb.on('finish', () => {
			if (!uploadedFile || !assetName) {
				return reject('No file uploaded');
			}
			if (isChunked) {
				const matches = (<string>request.headers['content-range']).match(contentRangeRegExp)!;

				if (!matches) {
					reject('malformed content-range');
				}

				const [, unit, , start, end, size] = matches;

				uploadedFile.chunk = { unit, start: Number(start), end: Number(end), size: Number(size) };
			}
			if (options.validate === undefined) {
				return resolve([uploadedFile, fields, assetName]);
			}
			if (!options.validate(fields)) {
				return reject(`Invalid fields${options.validate.errors?.join(', ')}`);
			}
			return resolve([uploadedFile, fields, assetName]);
		});

		request.pipe(bb);
	});
