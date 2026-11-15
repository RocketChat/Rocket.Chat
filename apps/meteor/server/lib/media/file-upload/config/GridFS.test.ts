import { once } from 'node:events';
import { PassThrough } from 'node:stream';
import { beforeEach, describe, it } from 'node:test';

import { expect } from 'chai';
import proxyquire from 'proxyquire';
import sinon from 'sinon';

const getReadStream = sinon.stub();
const store = {
	getReadStream,
	transformRead: (rs: PassThrough, ws: PassThrough) => rs.pipe(ws),
	onReadError: sinon.stub(),
};

const fileUploadClasses: Record<string, { get: (file: unknown, req: unknown, res: unknown) => Promise<void> }> = {};

proxyquire.noCallThru().load('./GridFS', {
	'@rocket.chat/logger': {
		Logger: class {
			debug = sinon.stub();
		},
	},
	'../../../../ufs': { UploadFS: { getStore: () => store } },
	'../lib/FileUpload': {
		FileUpload: { configureUploadsStore: sinon.stub(), addExtensionTo: (file: unknown) => file },
		FileUploadClass: class {
			constructor(options: { name: string; get: (file: unknown, req: unknown, res: unknown) => Promise<void> }) {
				fileUploadClasses[options.name] = options;
			}
		},
	},
});

class FakeResponse extends PassThrough {
	statusCode = 200;

	private headers: Record<string, unknown> = {};

	setHeader(name: string, value: unknown) {
		this.headers[name.toLowerCase()] = value;
		return this;
	}

	getHeader(name: string) {
		return this.headers[name.toLowerCase()];
	}

	removeHeader(name: string) {
		delete this.headers[name.toLowerCase()];
	}

	writeHead(statusCode: number) {
		this.statusCode = statusCode;
		return this;
	}
}

const file = { _id: 'file-id', name: 'clip.mp4', type: 'video/mp4', size: 10 * 1024 * 1024, store: 'GridFS:Uploads' };

const requestThenDisconnect = async (headers: Record<string, string>) => {
	const res = new FakeResponse();
	await fileUploadClasses['GridFS:Uploads'].get({ ...file }, { url: '/file-upload/file-id/clip.mp4', headers }, res);

	res.destroy();
	await once(res, 'close');
};

describe('GridFS:Uploads', () => {
	let rs: PassThrough;

	beforeEach(() => {
		// A file that is still being read: data is available but the stream has not ended.
		rs = new PassThrough();
		rs.write(Buffer.alloc(64 * 1024));
		getReadStream.reset();
		getReadStream.resolves(rs);
	});

	it('should stop reading the file when the client goes away during a download', async () => {
		await requestThenDisconnect({});

		expect(rs.destroyed).to.be.true;
	});

	it('should stop reading the file when the client goes away during a range request', async () => {
		await requestThenDisconnect({ range: 'bytes=0-' });

		expect(rs.destroyed).to.be.true;
	});
});
