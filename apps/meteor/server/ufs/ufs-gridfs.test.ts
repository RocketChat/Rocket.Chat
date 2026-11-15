import { once } from 'node:events';
import { Readable } from 'node:stream';
import { beforeEach, describe, it } from 'node:test';

import { expect } from 'chai';
import proxyquire from 'proxyquire';
import sinon from 'sinon';

class FakeDownloadStream extends Readable {
	abort = sinon.stub().resolves();

	override _read() {
		// Chunks are pushed by each test.
	}
}

let downloadStream: FakeDownloadStream;

const { GridFSStore } = proxyquire.noCallThru().load('./ufs-gridfs', {
	'./ufs': {
		UploadFS: {
			Store: class {
				constructor(public options: unknown) {}
			},
			store: {},
		},
	},
	'../database/utils': {
		db: {},
		GridFSBucket: class {
			openDownloadStream() {
				return downloadStream;
			}
		},
	},
});

describe('GridFSStore', () => {
	const store = new GridFSStore({ name: 'GridFS:Uploads', collectionName: 'rocketchat_uploads' });

	beforeEach(() => {
		downloadStream = new FakeDownloadStream();
	});

	it('should close the GridFS cursor when a download is destroyed before it ends', async () => {
		const rs = await store.getReadStream('file-id', {});
		rs.push(Buffer.alloc(1024));

		rs.destroy();
		await once(rs, 'close');

		expect(downloadStream.abort.calledOnce).to.be.true;
	});

	it('should leave a download that ended alone', async () => {
		const rs = await store.getReadStream('file-id', {});
		rs.push(Buffer.alloc(1024));
		rs.push(null);

		rs.resume();
		await once(rs, 'close');

		expect(downloadStream.abort.called).to.be.false;
	});
});
