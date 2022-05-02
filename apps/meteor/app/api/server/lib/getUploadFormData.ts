import busboy from 'busboy';
import { Request } from 'express';

export interface IFormDataFields {
	file: any;
	filename: string;
	encoding: string;
	mimetype: string;
	fileBuffer: Buffer;
}

export interface IFormDataUpload {
	[key: string]: IFormDataFields;
}

export const getUploadFormData = async ({ request }: { request: Request }): Promise<IFormDataUpload> =>
	new Promise<IFormDataUpload>((resolve, reject) => {
		const bb = busboy({ headers: request.headers });

		const fields: IFormDataUpload = {};

		bb.on('file', (fieldname: string, file: any, { filename, encoding, mimeType: mimetype }: Record<string, any>) => {
			const fileData: any[] = [];

			console.log(file);
			file.on('data', (data: any) => fileData.push(data));

			file.on('end', () => {
				if (fields.hasOwnProperty(fieldname)) {
					return reject('Just 1 file is allowed');
				}

				fields[fieldname] = {
					file,
					filename,
					encoding,
					mimetype,
					fileBuffer: Buffer.concat(fileData),
				};
			});
		});

		bb.on('field', (fieldname: string, value: any) => {
			fields[fieldname] = value;
		});

		bb.on('finish', () => resolve(fields));

		request.pipe(bb);
	});
