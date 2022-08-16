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
