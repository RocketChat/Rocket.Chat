import busboy from 'busboy';

export const getUploadFormData = async ({ request }) =>
	new Promise((resolve, reject) => {
		const bb = busboy({ headers: request.headers, defParamCharset: 'utf8' });

		const fields = {};

		bb.on('file', (fieldname, file, { filename, encoding, mimeType: mimetype }) => {
			const fileData = [];

			console.log(file);
			file.on('data', (data) => fileData.push(data));

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

		bb.on('field', (fieldname, value) => {
			fields[fieldname] = value;
		});

		bb.on('finish', () => resolve(fields));

		request.pipe(bb);
	});
