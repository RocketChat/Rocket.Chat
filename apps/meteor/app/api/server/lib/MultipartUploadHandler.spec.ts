import { ReadableStream } from 'stream/web';

import { expect } from 'chai';

import { MultipartUploadHandler } from './MultipartUploadHandler';

const createMockRequest = (
	file: {
		fieldname: string;
		filename: string;
		content: string;
		mimetype?: string;
	},
	fields: Record<string, string> = {},
): Request => {
	const boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW';
	const parts: string[] = [];

	parts.push(
		`--${boundary}`,
		`Content-Disposition: form-data; name="${file.fieldname}"; filename="${file.filename}"`,
		`Content-Type: ${file.mimetype || 'application/octet-stream'}`,
		'',
		file.content,
	);

	for (const [name, value] of Object.entries(fields)) {
		parts.push(`--${boundary}`, `Content-Disposition: form-data; name="${name}"`, '', value);
	}

	parts.push(`--${boundary}--`);

	const buffer = Buffer.from(parts.join('\r\n'));

	const mockRequest: any = {
		headers: {
			entries: () => [['content-type', `multipart/form-data; boundary=${boundary}`]],
		},
		body: new ReadableStream({
			async pull(controller) {
				controller.enqueue(buffer);
				controller.close();
			},
		}),
	};

	return mockRequest as Request;
};

describe('MultipartUploadHandler', () => {
	describe('parseRequest', () => {
		it('should decode %22 (double quotes) in filename as per the HTML5 multipart/form-data encoding algorithm', async () => {
			const mockRequest = createMockRequest({
				fieldname: 'file',
				filename: 'This is %22test%22.jpg',
				content: 'file content',
				mimetype: 'image/jpeg',
			});

			const { file } = await MultipartUploadHandler.parseRequest(mockRequest, { field: 'file' });

			expect(file?.filename).to.equal('This is "test".jpg');
		});

		it('should decode %0A (newline) in filename', async () => {
			const mockRequest = createMockRequest({
				fieldname: 'file',
				filename: 'test%0Afile.txt',
				content: 'file content',
				mimetype: 'text/plain',
			});

			const { file } = await MultipartUploadHandler.parseRequest(mockRequest, { field: 'file' });

			expect(file?.filename).to.equal('test\nfile.txt');
		});

		it('should decode %0D%0A (CRLF) in filename', async () => {
			const mockRequest = createMockRequest({
				fieldname: 'file',
				filename: 'test%0D%0Afile.txt',
				content: 'file content',
				mimetype: 'text/plain',
			});

			const { file } = await MultipartUploadHandler.parseRequest(mockRequest, { field: 'file' });

			expect(file?.filename).to.equal('test\r\nfile.txt');
		});

		it('should not decode other percent-encoded characters like %20 (space)', async () => {
			const mockRequest = createMockRequest({
				fieldname: 'file',
				filename: 'test%20file.txt',
				content: 'file content',
				mimetype: 'text/plain',
			});

			const { file } = await MultipartUploadHandler.parseRequest(mockRequest, { field: 'file' });

			// %20 is NOT encoded by the HTML5 spec; if it appears literally it should stay as-is
			expect(file?.filename).to.equal('test%20file.txt');
		});

		it('should handle filename without any percent-encoded characters', async () => {
			const mockRequest = createMockRequest({
				fieldname: 'file',
				filename: 'normal-file.txt',
				content: 'file content',
				mimetype: 'text/plain',
			});

			const { file } = await MultipartUploadHandler.parseRequest(mockRequest, { field: 'file' });

			expect(file?.filename).to.equal('normal-file.txt');
		});
	});
});
