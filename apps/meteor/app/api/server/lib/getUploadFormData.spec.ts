import { Readable } from 'stream';

import { expect } from 'chai';
import type { Request } from 'express';

import { getUploadFormData } from './getUploadFormData';

const createMockRequest = (
	fields: Record<string, string>,
	file?: {
		fieldname: string;
		filename: string;
		content: string | Buffer;
		mimetype?: string;
	},
): Readable & { headers: Record<string, string> } => {
	const boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW';
	const parts: string[] = [];

	if (file) {
		parts.push(
			`--${boundary}`,
			`Content-Disposition: form-data; name="${file.fieldname}"; filename="${file.filename}"`,
			`Content-Type: ${file.mimetype || 'application/octet-stream'}`,
			'',
			file.content.toString(),
		);
	}

	for (const [name, value] of Object.entries(fields)) {
		parts.push(`--${boundary}`, `Content-Disposition: form-data; name="${name}"`, '', value);
	}

	parts.push(`--${boundary}--`);

	const mockRequest: any = new Readable({
		read() {
			this.push(Buffer.from(parts.join('\r\n')));
			this.push(null);
		},
	});

	mockRequest.headers = {
		'content-type': `multipart/form-data; boundary=${boundary}`,
	};

	return mockRequest as Readable & { headers: Record<string, string> };
};

describe('getUploadFormData', () => {
	it('should successfully parse a single file upload and fields', async () => {
		const mockRequest = createMockRequest(
			{ fieldName: 'fieldValue' },
			{
				fieldname: 'fileField',
				filename: 'test.txt',
				content: 'Hello, this is a test file!',
				mimetype: 'text/plain',
			},
		);

		const result = await getUploadFormData({ request: mockRequest as Request }, { field: 'fileField' });

		expect(result).to.deep.include({
			fieldname: 'fileField',
			filename: 'test.txt',
			mimetype: 'text/plain',
			fields: { fieldName: 'fieldValue' },
		});

		expect(result.fileBuffer).to.not.be.undefined;
		expect(result.fileBuffer.toString()).to.equal('Hello, this is a test file!');
	});

	it('should throw an error when no file is uploaded and fileOptional is false', async () => {
		const mockRequest = createMockRequest({ fieldName: 'fieldValue' });

		try {
			await getUploadFormData({ request: mockRequest as Request }, { fileOptional: false });
			throw new Error('Expected function to throw');
		} catch (error) {
			expect((error as Error).message).to.equal('[No file uploaded]');
		}
	});

	it('should return fields without errors when no file is uploaded but fileOptional is true', async () => {
		const mockRequest = createMockRequest({ fieldName: 'fieldValue' }); // No file

		const result = await getUploadFormData({ request: mockRequest as Request }, { fileOptional: true });

		expect(result).to.deep.equal({
			fields: { fieldName: 'fieldValue' },
			file: undefined,
			fileBuffer: undefined,
			fieldname: undefined,
			filename: undefined,
			encoding: undefined,
			mimetype: undefined,
		});
	});

	it('should reject an oversized file', async () => {
		const mockRequest = createMockRequest(
			{},
			{
				fieldname: 'fileField',
				filename: 'large.txt',
				content: 'x'.repeat(1024 * 1024 * 2), // 2 MB file
				mimetype: 'text/plain',
			},
		);

		try {
			await getUploadFormData(
				{ request: mockRequest as Request },
				{ sizeLimit: 1024 * 1024 }, // 1 MB limit
			);
			throw new Error('Expected function to throw');
		} catch (error) {
			expect((error as Error).message).to.equal('[error-file-too-large]');
		}
	});
});
