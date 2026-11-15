import { EventEmitter } from 'events';

import { expect } from 'chai';
import { describe, it, beforeEach } from 'mocha';
import proxyquire from 'proxyquire';
import sinon from 'sinon';

class MockIncomingMessage extends EventEmitter {
	statusCode: number;

	headers: Record<string, string>;

	constructor(statusCode: number, headers: Record<string, string> = {}) {
		super();
		this.statusCode = statusCode;
		this.headers = headers;
	}

	resume() {
		// no-op
	}
}

class MockClientRequest extends EventEmitter {
	// no-op
}

const createMockHttpModule = (responseFactory: () => MockIncomingMessage, errorOnConnect = false) => ({
	get: (_url: string, callback: (res: MockIncomingMessage) => void) => {
		const req = new MockClientRequest();

		if (errorOnConnect) {
			setImmediate(() => req.emit('error', new Error('Connection refused')));
		} else {
			setImmediate(() => {
				const res = responseFactory();
				callback(res);
			});
		}

		return req;
	},
});

const createPendingFileImporter = (httpMock: ReturnType<typeof createMockHttpModule>) => {
	const { PendingFileImporter } = proxyquire.noCallThru().load('../../../../../server/lib/import/pending-files/PendingFileImporter', {
		'node:http': httpMock,
		'node:https': httpMock,
		'@rocket.chat/core-services': { api: { broadcast: sinon.stub() } },
		'@rocket.chat/models': {
			Messages: {
				countAllImportedMessagesWithFilesToDownload: sinon.stub().resolves(0),
				findAllImportedMessagesWithFilesToDownload: sinon.stub().returns([]),
				setImportFileRocketChatAttachment: sinon.stub().resolves(),
			},
			Users: {
				findOneById: sinon.stub().resolves(null),
			},
		},
		'@rocket.chat/random': { Random: { id: () => 'random-id' } },
		'../../media/file-upload': { FileUpload: { getStore: sinon.stub(), getPath: sinon.stub() } },
		'../../../meteor-methods/messages/sendFileMessage': { parseFileIntoMessageAttachments: sinon.stub() },
		'..': {
			Importer: class MockImporter {
				logger = { debug: sinon.stub(), error: sinon.stub(), info: sinon.stub() };

				progress = { count: { total: 0 } };

				reportProgress() {
					// no-op
				}

				async updateProgress() {
					// no-op
				}

				async updateRecord() {
					// no-op
				}

				async addCountCompleted() {
					// no-op
				}

				async addCountError() {
					// no-op
				}

				getProgress() {
					return this.progress;
				}

				isCursorNotFoundError() {
					return false;
				}
			},
			ProgressStep: {
				PREPARING_STARTED: 'preparing_started',
				IMPORTING_FILES: 'importing_files',
				DONE: 'done',
				ERROR: 'error',
			},
		},
	});

	const info = { key: 'pending-files', name: 'Pending Files' };
	const importRecord = { _id: 'test-import' };

	return new PendingFileImporter(info, importRecord, {});
};

describe('PendingFileImporter', () => {
	describe('downloadFile', () => {
		it('should resolve with buffer on successful 200 response', async () => {
			const responseData = Buffer.from('file content');
			const httpMock = createMockHttpModule(() => {
				const res = new MockIncomingMessage(200, { 'content-type': 'image/png' });
				setImmediate(() => {
					res.emit('data', responseData);
					res.emit('end');
				});
				return res;
			});

			const importer = createPendingFileImporter(httpMock);
			const details: { type?: string } = {};

			// Access private method through the instance
			const result = await (importer as any).downloadFile('https://example.com/file.png', details);

			expect(result).to.deep.equal(responseData);
			expect(details.type).to.equal('image/png');
		});

		it('should reject on non-2xx status codes (e.g., 302 redirect)', async () => {
			const httpMock = createMockHttpModule(() => {
				const res = new MockIncomingMessage(302, { location: 'https://example.com/login' });
				return res;
			});

			const importer = createPendingFileImporter(httpMock);
			const details: { type?: string } = {};

			try {
				await (importer as any).downloadFile('https://example.com/file.png', details);
				expect.fail('Should have thrown an error');
			} catch (err: any) {
				expect(err.message).to.include('Unexpected response status 302');
			}
		});

		it('should reject on 404 status code', async () => {
			const httpMock = createMockHttpModule(() => {
				const res = new MockIncomingMessage(404);
				return res;
			});

			const importer = createPendingFileImporter(httpMock);
			const details: { type?: string } = {};

			try {
				await (importer as any).downloadFile('https://example.com/file.png', details);
				expect.fail('Should have thrown an error');
			} catch (err: any) {
				expect(err.message).to.include('Unexpected response status 404');
			}
		});

		it('should reject on 500 server error', async () => {
			const httpMock = createMockHttpModule(() => {
				const res = new MockIncomingMessage(500);
				return res;
			});

			const importer = createPendingFileImporter(httpMock);
			const details: { type?: string } = {};

			try {
				await (importer as any).downloadFile('https://example.com/file.png', details);
				expect.fail('Should have thrown an error');
			} catch (err: any) {
				expect(err.message).to.include('Unexpected response status 500');
			}
		});

		it('should reject on connection errors', async () => {
			const httpMock = createMockHttpModule(
				() => new MockIncomingMessage(200),
				true, // errorOnConnect
			);

			const importer = createPendingFileImporter(httpMock);
			const details: { type?: string } = {};

			try {
				await (importer as any).downloadFile('https://example.com/file.png', details);
				expect.fail('Should have thrown an error');
			} catch (err: any) {
				expect(err.message).to.equal('Connection refused');
			}
		});

		it('should reject on stream errors during download', async () => {
			const httpMock = createMockHttpModule(() => {
				const res = new MockIncomingMessage(200, { 'content-type': 'image/png' });
				setImmediate(() => {
					res.emit('data', Buffer.from('partial'));
					res.emit('error', new Error('Stream error'));
				});
				return res;
			});

			const importer = createPendingFileImporter(httpMock);
			const details: { type?: string } = {};

			try {
				await (importer as any).downloadFile('https://example.com/file.png', details);
				expect.fail('Should have thrown an error');
			} catch (err: any) {
				expect(err.message).to.equal('Stream error');
			}
		});

		it('should not set content-type if details already has a type', async () => {
			const responseData = Buffer.from('file content');
			const httpMock = createMockHttpModule(() => {
				const res = new MockIncomingMessage(200, { 'content-type': 'text/html' });
				setImmediate(() => {
					res.emit('data', responseData);
					res.emit('end');
				});
				return res;
			});

			const importer = createPendingFileImporter(httpMock);
			const details: { type?: string } = { type: 'image/png' };

			await (importer as any).downloadFile('https://example.com/file.png', details);

			expect(details.type).to.equal('image/png');
		});

		it('should handle responses with undefined statusCode', async () => {
			const httpMock = createMockHttpModule(() => {
				const res = new MockIncomingMessage(undefined as any);
				return res;
			});

			const importer = createPendingFileImporter(httpMock);
			const details: { type?: string } = {};

			try {
				await (importer as any).downloadFile('https://example.com/file.png', details);
				expect.fail('Should have thrown an error');
			} catch (err: any) {
				expect(err.message).to.include('Unexpected response status');
			}
		});

		it('should accept status code 201', async () => {
			const responseData = Buffer.from('created');
			const httpMock = createMockHttpModule(() => {
				const res = new MockIncomingMessage(201);
				setImmediate(() => {
					res.emit('data', responseData);
					res.emit('end');
				});
				return res;
			});

			const importer = createPendingFileImporter(httpMock);
			const details: { type?: string } = {};

			const result = await (importer as any).downloadFile('https://example.com/file.png', details);
			expect(result).to.deep.equal(responseData);
		});
	});

	describe('getMessageAttachment', () => {
		let importer: any;

		beforeEach(() => {
			const httpMock = createMockHttpModule(() => new MockIncomingMessage(200));
			importer = createPendingFileImporter(httpMock);
		});

		it('should create image attachment for image types', () => {
			const file = { _id: 'file-1', name: 'image.png', type: 'image/png', size: 1024 };
			const url = '/file-upload/file-1/image.png';

			const attachment = importer.getMessageAttachment(file, url);

			expect(attachment).to.deep.equal({
				title: 'image.png',
				title_link: url,
				image_url: url,
				image_type: 'image/png',
				image_size: 1024,
				image_dimensions: undefined,
			});
		});

		it('should create audio attachment for audio types', () => {
			const file = { _id: 'file-1', name: 'audio.mp3', type: 'audio/mpeg', size: 2048 };
			const url = '/file-upload/file-1/audio.mp3';

			const attachment = importer.getMessageAttachment(file, url);

			expect(attachment).to.deep.equal({
				title: 'audio.mp3',
				title_link: url,
				audio_url: url,
				audio_type: 'audio/mpeg',
				audio_size: 2048,
			});
		});

		it('should create video attachment for video types', () => {
			const file = { _id: 'file-1', name: 'video.mp4', type: 'video/mp4', size: 4096 };
			const url = '/file-upload/file-1/video.mp4';

			const attachment = importer.getMessageAttachment(file, url);

			expect(attachment).to.deep.equal({
				title: 'video.mp4',
				title_link: url,
				video_url: url,
				video_type: 'video/mp4',
				video_size: 4096,
			});
		});

		it('should create generic attachment for other types', () => {
			const file = { _id: 'file-1', name: 'doc.pdf', type: 'application/pdf', size: 8192 };
			const url = '/file-upload/file-1/doc.pdf';

			const attachment = importer.getMessageAttachment(file, url);

			expect(attachment).to.deep.equal({
				title: 'doc.pdf',
				title_link: url,
			});
		});

		it('should create generic attachment for files without type', () => {
			const file = { _id: 'file-1', name: 'unknown', size: 512 };
			const url = '/file-upload/file-1/unknown';

			const attachment = importer.getMessageAttachment(file, url);

			expect(attachment).to.deep.equal({
				title: 'unknown',
				title_link: url,
			});
		});
	});
});
