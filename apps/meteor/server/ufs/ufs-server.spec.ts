import { Readable, Writable } from 'node:stream';

import { expect } from 'chai';
import { describe, it, beforeEach } from 'mocha';
import proxyquire from 'proxyquire';
import sinon from 'sinon';

class FakeResponse extends Writable {
	statusCode: number | undefined;

	headers: Record<string, any> = {};

	headersSent = false;

	chunks: Buffer[] = [];

	_write(chunk: any, _enc: string, cb: (error?: Error | null) => void) {
		this.chunks.push(Buffer.from(chunk));
		cb();
	}

	writeHead(status: number, headers?: Record<string, any>) {
		this.statusCode = status;
		this.headers = headers || {};
		this.headersSent = true;
		return this;
	}

	setHeader(name: string, value: any) {
		this.headers[name] = value;
	}
}

describe('ufs-server request handler', () => {
	let handler: (req: any, res: any, next: () => void) => Promise<void>;
	let store: any;
	const fileContent = Buffer.from('0123456789');
	const file = {
		_id: 'file123',
		size: fileContent.length,
		type: 'video/mp4',
		etag: 'etag123',
	};

	beforeEach(() => {
		let capturedHandler: any;

		store = {
			onRead: sinon.stub().resolves(true),
			onReadError: sinon.stub(),
			getCollection: () => ({ findOne: sinon.stub().resolves(file) }),
			getReadStream: sinon.stub().callsFake(async (_fileId: string, _file: any, options: { start?: number; end?: number } = {}) => {
				const { start = 0, end = fileContent.length - 1 } = options;
				return Readable.from(fileContent.subarray(start, end + 1));
			}),
			transformRead: (rs: Readable, ws: Writable) => {
				rs.pipe(ws);
			},
		};

		const ufsServerModule = proxyquire.noCallThru().load('./ufs-server', {
			'meteor/meteor': {
				Meteor: { startup: (_fn: () => void) => {} },
			},
			'meteor/webapp': {
				WebApp: {
					connectHandlers: {
						use: (fn: any) => {
							capturedHandler = fn;
						},
					},
				},
			},
			mkdirp: sinon.stub().resolves(),
			'./ufs': {
				UploadFS: {
					config: { tmpDir: '/tmp/ufs', tmpDirPermissions: 0o755, storesPath: 'ufs' },
					getStore: sinon.stub().returns(store),
				},
			},
		});

		handler = capturedHandler;
		expect(handler, 'handler should have been registered via WebApp.connectHandlers.use').to.be.a('function');
	});

	it('advertises Accept-Ranges: bytes on a plain GET request', async () => {
		const req = { url: '/ufs/store1/file123/video.mp4', method: 'GET', headers: {} };
		const res = new FakeResponse();

		await handler(req, res, () => {});

		expect(res.statusCode).to.equal(200);
		expect(res.headers['Accept-Ranges']).to.equal('bytes');
	});

	it('returns 206 and Content-Range for a byte-range GET request', async () => {
		const req = {
			url: '/ufs/store1/file123/video.mp4',
			method: 'GET',
			headers: { range: 'bytes=2-5' },
		};
		const res = new FakeResponse();

		await handler(req, res, () => {});

		expect(res.statusCode).to.equal(206);
		expect(res.headers['Content-Range']).to.equal(`bytes 2-5/${fileContent.length}`);
		expect(res.headers['Accept-Ranges']).to.equal('bytes');
		expect(Buffer.concat(res.chunks).toString()).to.equal('2345');
	});
});
