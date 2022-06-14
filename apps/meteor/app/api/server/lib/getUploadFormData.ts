import { Readable } from 'stream';

import { Request } from 'express';
import busboy from 'busboy';

export const getUploadFormData = async ({
	request,
}: {
	request: Request;
}): Promise<{ file: Readable; filename: string; encoding: string; mimetype: string; fileBuffer: Buffer }> =>
	new Promise((resolve, reject) => {
		const bb = busboy({ headers: request.headers, defParamCharset: 'utf8' });
		let fields: {
			[key: string]: string | string[] | unknown;
			file: Readable;
			filename: string;
			encoding: string;
			mimetype: string;
			fileBuffer: Buffer;
		} = Object.create(null);

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
					if (fields.hasOwnProperty(fieldname)) {
						return reject('Just 1 file is allowed');
					}

					fields = {
						file,
						filename,
						encoding,
						mimetype,
						fileBuffer: Buffer.concat(fileData),
					};
				});
			},
		);

		bb.on('field', (fieldname: string, value: string & Readable & Buffer) => {
			fields[fieldname as keyof typeof fields] = value;
		});

		bb.on('finish', () => resolve(fields));

		request.pipe(bb);
	});
