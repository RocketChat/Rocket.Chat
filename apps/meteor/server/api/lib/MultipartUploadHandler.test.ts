import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { Writable } from 'node:stream';
import { ReadableStream } from 'node:stream/web';
import { describe, it } from 'node:test';

import { expect } from 'chai';
import proxyquire from 'proxyquire';
import sinon from 'sinon';

class MockClientSafeError extends Error {
	constructor(
		public error: string,
		message?: string,
	) {
		super(message ?? error);
	}
}

const createMockRequest = () => {
	const boundary = '----MultipartUploadTestBoundary';

	let controller!: ReadableStreamDefaultController<Uint8Array>;

	const request = {
		headers: new Headers({
			'content-type': `multipart/form-data; boundary=${boundary}`,
		}),
		body: new ReadableStream<Uint8Array>({
			start(streamController) {
				controller = streamController;
			},
		}),
	} as Request;

	return {
		request,

		sendFirstFile() {
			controller.enqueue(
				Buffer.from(
					[
						`--${boundary}`,
						'Content-Disposition: form-data; name="file"; filename="first.txt"',
						'Content-Type: text/plain',
						'',
						'First file content',
						'',
					].join('\r\n'),
				),
			);
		},
		sendSecondFile() {
			controller.enqueue(
				Buffer.from(
					[
						`--${boundary}`,
						'Content-Disposition: form-data; name="file"; filename="second.txt"',
						'Content-Type: text/plain',
						'',
						'Second file content',
						`--${boundary}--`,
						'',
					].join('\r\n'),
				),
			);
			controller.close();
		},
		sendSingleFile() {
			controller.enqueue(
				Buffer.from(
					[
						`--${boundary}`,
						'Content-Disposition: form-data; name="file"; filename="single.txt"',
						'Content-Type: text/plain',
						'',
						'Single file content',
						'',
						`--${boundary}--`,
						'',
					].join('\r\n'),
				),
			);

			controller.close();
		},

		abortBody(error = new Error('Request body aborted')) {
			controller.error(error);
		},
	};
};

describe('MultipartUploadHandler', () => {
	it('should clean up a temporary file when multiple files are uploaded', async () => {
		const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'multipart-upload-'));
		const tempFilePath = path.join(tempDir, 'first-upload');

		let releaseWrite: (() => void) | undefined;
		let uploadWriteStream: Writable | undefined;
		let resolveWriteStarted!: () => void;

		const writeStarted = new Promise<void>((resolve) => {
			resolveWriteStarted = resolve;
		});

		let writeClosed!: Promise<void>;

		const { MultipartUploadHandler } = proxyquire.noCallThru().load('./MultipartUploadHandler', {
			'@rocket.chat/core-services': {
				ClientSafeError: MockClientSafeError,
			},
			'@rocket.chat/random': {
				Random: {
					id: () => 'first-upload',
				},
			},
			'../../ufs': {
				UploadFS: {
					getTempFilePath: () => tempFilePath,
				},
			},
			'../../../lib/mimeTypes': {
				getMimeType: () => 'text/plain',
			},
			'exif-be-gone': {
				__esModule: true,
				default: class {},
			},
		}) as typeof import('./MultipartUploadHandler');

		const createWriteStreamStub = sinon.stub(fs, 'createWriteStream').callsFake(((filePath: fs.PathLike) => {
			const stream = new Writable({
				write(chunk, _encoding, callback) {
					// Create the temporary file before holding the write callback.
					fs.writeFileSync(filePath, chunk);

					resolveWriteStarted();

					releaseWrite = () => {
						if (stream.destroyed) {
							return;
						}

						releaseWrite = undefined;
						callback();
					};
				},
			});

			uploadWriteStream = stream;

			writeClosed = new Promise<void>((resolve) => {
				stream.once('close', resolve);
			});

			return stream;
		}) as any);

		try {
			const mockRequest = createMockRequest();

			const parsePromise = MultipartUploadHandler.parseRequest(mockRequest.request, {
				field: 'file',
			});

			// Attach rejection handling immediately.
			const parseResult = parsePromise.then(
				(value) => ({ value }),
				(error: unknown) => ({ error }),
			);

			// Send the first file and wait until its write begins.
			mockRequest.sendFirstFile();

			await writeStarted;

			expect(fs.existsSync(tempFilePath)).to.equal(true);

			// Send the second file to trigger the filesLimit event.
			mockRequest.sendSecondFile();

			const result = await parseResult;

			expect('error' in result).to.equal(true);

			if ('error' in result) {
				expect(result.error).to.be.instanceOf(MockClientSafeError);
				expect((result.error as Error).message).to.equal('Too many files in upload');
			}

			expect(uploadWriteStream?.destroyed).to.equal(true);

			await writeClosed;

			// The temporary file must be removed after parsing fails.
			expect(fs.existsSync(tempFilePath)).to.equal(false);
		} finally {
			releaseWrite?.();

			createWriteStreamStub.restore();

			await fs.promises.rm(tempDir, {
				recursive: true,
				force: true,
			});
		}
	});
	it('should clean up a temporary file when the write stream fails', async () => {
		const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'multipart-upload-'));
		const tempFilePath = path.join(tempDir, 'failed-upload');

		let resolveWriteStarted!: () => void;

		const writeStarted = new Promise<void>((resolve) => {
			resolveWriteStarted = resolve;
		});

		let writeClosed!: Promise<void>;

		const { MultipartUploadHandler } = proxyquire.noCallThru().load('./MultipartUploadHandler', {
			'@rocket.chat/core-services': {
				ClientSafeError: MockClientSafeError,
			},
			'@rocket.chat/random': {
				Random: {
					id: () => 'failed-upload',
				},
			},
			'../../ufs': {
				UploadFS: {
					getTempFilePath: () => tempFilePath,
				},
			},
			'../../../lib/mimeTypes': {
				getMimeType: () => 'text/plain',
			},
			'exif-be-gone': {
				__esModule: true,
				default: class {},
			},
		}) as typeof import('./MultipartUploadHandler');

		const createWriteStreamStub = sinon.stub(fs, 'createWriteStream').callsFake(((filePath: fs.PathLike) => {
			const stream = new Writable({
				write(chunk, _encoding, callback) {
					// Create the temporary file before simulating a disk-write failure.
					fs.writeFileSync(filePath, chunk);

					resolveWriteStarted();

					setImmediate(() => {
						callback(new Error('disk write failed'));
					});
				},
			});

			writeClosed = new Promise<void>((resolve) => {
				stream.once('close', resolve);
			});

			return stream;
		}) as any);

		try {
			const mockRequest = createMockRequest();

			const parsePromise = MultipartUploadHandler.parseRequest(mockRequest.request, {
				field: 'file',
			});

			const parseResult = parsePromise.then(
				(value) => ({ value }),
				(error: unknown) => ({ error }),
			);

			mockRequest.sendSingleFile();

			await writeStarted;

			expect(fs.existsSync(tempFilePath)).to.equal(true);

			const result = await parseResult;

			expect('error' in result).to.equal(true);

			if (!('error' in result)) {
				throw new Error('Expected parsing to fail when the write stream errors');
			}

			expect(result.error).to.be.instanceOf(MockClientSafeError);
			expect((result.error as MockClientSafeError).error).to.equal('error-file-upload');
			expect((result.error as Error).message).to.equal('disk write failed');

			await writeClosed;

			expect(fs.existsSync(tempFilePath)).to.equal(false);
		} finally {
			createWriteStreamStub.restore();

			await fs.promises.rm(tempDir, {
				recursive: true,
				force: true,
			});
		}
	});
	it('should successfully parse a single file upload', async () => {
		const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'multipart-upload-'));
		const tempFilePath = path.join(tempDir, 'successful-upload');

		const { MultipartUploadHandler } = proxyquire.noCallThru().load('./MultipartUploadHandler', {
			'@rocket.chat/core-services': {
				ClientSafeError: MockClientSafeError,
			},
			'@rocket.chat/random': {
				Random: {
					id: () => 'successful-upload',
				},
			},
			'../../ufs': {
				UploadFS: {
					getTempFilePath: () => tempFilePath,
				},
			},
			'../../../lib/mimeTypes': {
				getMimeType: () => 'text/plain',
			},
			'exif-be-gone': {
				__esModule: true,
				default: class {},
			},
		}) as typeof import('./MultipartUploadHandler');

		try {
			const mockRequest = createMockRequest();

			mockRequest.sendSingleFile();

			const result = await MultipartUploadHandler.parseRequest(mockRequest.request, {
				field: 'file',
			});

			expect(result.file).not.to.equal(null);
			expect(result.file?.filename).to.equal('single.txt');
			expect(result.file?.mimetype).to.equal('text/plain');
			expect(result.file?.fieldname).to.equal('file');
			expect(result.file?.size).to.equal(Buffer.byteLength('Single file content\r\n'));
			expect(fs.existsSync(tempFilePath)).to.equal(true);
			expect(fs.readFileSync(tempFilePath, 'utf8')).to.equal('Single file content\r\n');
		} finally {
			await fs.promises.rm(tempDir, {
				recursive: true,
				force: true,
			});
		}
	});

	it('should clean up a temporary file when the request body is aborted', async () => {
		const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'multipart-upload-'));
		const tempFilePath = path.join(tempDir, 'aborted-upload');

		let resolveWriteStarted!: () => void;
		let releaseWrite: (() => void) | undefined;
		let uploadWriteStream: Writable | undefined;

		const writeStarted = new Promise<void>((resolve) => {
			resolveWriteStarted = resolve;
		});

		let writeClosed!: Promise<void>;

		const { MultipartUploadHandler } = proxyquire.noCallThru().load('./MultipartUploadHandler', {
			'@rocket.chat/core-services': {
				ClientSafeError: MockClientSafeError,
			},
			'@rocket.chat/random': {
				Random: {
					id: () => 'aborted-upload',
				},
			},
			'../../ufs': {
				UploadFS: {
					getTempFilePath: () => tempFilePath,
				},
			},
			'../../../lib/mimeTypes': {
				getMimeType: () => 'text/plain',
			},
			'exif-be-gone': {
				__esModule: true,
				default: class {},
			},
		}) as typeof import('./MultipartUploadHandler');

		const createWriteStreamStub = sinon.stub(fs, 'createWriteStream').callsFake(((filePath: fs.PathLike) => {
			const stream = new Writable({
				write(chunk, _encoding, callback) {
					fs.writeFileSync(filePath, chunk);
					resolveWriteStarted();

					releaseWrite = () => {
						if (stream.destroyed) {
							return;
						}

						releaseWrite = undefined;
						callback();
					};
				},
			});

			uploadWriteStream = stream;

			writeClosed = new Promise<void>((resolve) => {
				stream.once('close', resolve);
			});

			return stream;
		}) as any);

		try {
			const mockRequest = createMockRequest();

			const parsePromise = MultipartUploadHandler.parseRequest(mockRequest.request, {
				field: 'file',
			});

			const parseResult = parsePromise.then(
				(value) => ({ value }),
				(error: unknown) => ({ error }),
			);

			mockRequest.sendFirstFile();

			await writeStarted;

			expect(fs.existsSync(tempFilePath)).to.equal(true);

			// Simulate the incoming request body failing during upload.
			mockRequest.abortBody();

			const result = await parseResult;

			expect('error' in result).to.equal(true);

			if ('error' in result) {
				expect(result.error).to.be.instanceOf(MockClientSafeError);
				expect((result.error as MockClientSafeError).error).to.equal('error-upload-failed');
			}

			expect(uploadWriteStream?.destroyed).to.equal(true);

			await writeClosed;

			expect(fs.existsSync(tempFilePath)).to.equal(false);
		} finally {
			releaseWrite?.();

			createWriteStreamStub.restore();

			await fs.promises.rm(tempDir, {
				recursive: true,
				force: true,
			});
		}
	});
});
