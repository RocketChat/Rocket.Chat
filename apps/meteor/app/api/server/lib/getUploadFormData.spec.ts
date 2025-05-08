import { expect } from 'chai';

import { getUploadFormData } from './getUploadFormData';

const createMockRequest = (
	fields: Record<string, string>,
	file?: {
		fieldname: string;
		filename: string;
		content: string | Buffer;
		mimetype?: string;
	},
): Request => {
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

	const buffer = Buffer.from(parts.join('\r\n'));

	const mockRequest: any = {
		headers: {
			entries: () => [['content-type', `multipart/form-data; boundary=${boundary}`]],
		},
		blob: async () => ({
			stream: () => {
				let hasRead = false;
				return {
					getReader: () => ({
						read: async () => {
							if (!hasRead) {
								hasRead = true;
								return { value: buffer, done: false };
							}
							return { done: true };
						},
					}),
				};
			},
		}),
	};

	return mockRequest as Request & { headers: Record<string, string> };
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

		const result = await getUploadFormData({ request: mockRequest }, { field: 'fileField' });

		expect(result).to.deep.include({
			fieldname: 'fileField',
			filename: 'test.txt',
			mimetype: 'text/plain',
			fields: { fieldName: 'fieldValue' },
		});

		expect(result.fileBuffer).to.not.be.undefined;
		expect(result.fileBuffer.toString()).to.equal('Hello, this is a test file!');
	});
	it('should parse a file upload with multiple additional fields', async () => {
		const mockRequest = createMockRequest(
			{
				fieldName: 'fieldValue',
				extraField1: 'extraValue1',
				extraField2: 'extraValue2',
			},
			{
				fieldname: 'fileField',
				filename: 'test_with_fields.txt',
				content: 'This file has additional fields!',
				mimetype: 'text/plain',
			},
		);

		const result = await getUploadFormData({ request: mockRequest }, { field: 'fileField' });

		expect(result).to.deep.include({
			fieldname: 'fileField',
			filename: 'test_with_fields.txt',
			mimetype: 'text/plain',
			fields: {
				fieldName: 'fieldValue',
				extraField1: 'extraValue1',
				extraField2: 'extraValue2',
			},
		});

		expect(result.fileBuffer).to.not.be.undefined;
		expect(result.fileBuffer.toString()).to.equal('This file has additional fields!');
	});

	it('should handle a file upload when fileOptional is true', async () => {
		const mockRequest = createMockRequest(
			{ fieldName: 'fieldValue' },
			{
				fieldname: 'fileField',
				filename: 'optional.txt',
				content: 'This file is optional!',
				mimetype: 'text/plain',
			},
		);

		const result = await getUploadFormData({ request: mockRequest }, { fileOptional: true });

		expect(result).to.deep.include({
			fieldname: 'fileField',
			filename: 'optional.txt',
			mimetype: 'text/plain',
			fields: { fieldName: 'fieldValue' },
		});

		expect(result.fileBuffer).to.not.be.undefined;
		expect(result.fileBuffer?.toString()).to.equal('This file is optional!');
	});

	it('should throw an error when no file is uploaded and fileOptional is false', async () => {
		const mockRequest = createMockRequest({ fieldName: 'fieldValue' });

		try {
			await getUploadFormData({ request: mockRequest }, { fileOptional: false });
			throw new Error('Expected function to throw');
		} catch (error) {
			expect((error as Error).message).to.equal('[No file uploaded]');
		}
	});

	it('should return fields without errors when no file is uploaded but fileOptional is true', async () => {
		const mockRequest = createMockRequest({ fieldName: 'fieldValue' }); // No file

		const result = await getUploadFormData({ request: mockRequest }, { fileOptional: true });

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
				{ request: mockRequest },
				{ sizeLimit: 1024 * 1024 }, // 1 MB limit
			);
			throw new Error('Expected function to throw');
		} catch (error) {
			expect((error as Error).message).to.equal('[error-file-too-large]');
		}
	});
});
