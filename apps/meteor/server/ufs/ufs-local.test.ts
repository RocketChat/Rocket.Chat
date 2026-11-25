import fs from 'node:fs';
import { afterEach, before, beforeEach, describe, it, mock } from 'node:test';

import { expect } from 'chai';
import sinon from 'sinon';
import type { SinonStub } from 'sinon';

// import { Config } from './ufs-config';
// import { UploadFS } from './ufs';
import type { LocalStore as LocalStoreClass } from './ufs-local';

const fakeCollection = {
	removeById: sinon.stub(),
	findOne: sinon.stub(),
};

let LocalStore: typeof LocalStoreClass;

before(async () => {
	mock.module('./ufs-store', { exports: { Store: Object } });
	const { UploadFS } = await import('./ufs');
	mock.restoreAll();

	mock.module('./index', { exports: { UploadFS } });
	({ LocalStore } = await import('./ufs-local'));
});

describe('LocalStore', () => {
	let store: LocalStoreClass;
	let unlinkStub: SinonStub;

	before(() => {
		fakeCollection.removeById.resolves();
		fakeCollection.findOne.resolves({ _id: 'test', name: 'file.txt' });
		store = new LocalStore({ name: 'test', collection: fakeCollection as any, path: '/tmp/ufs-local' });
	});

	beforeEach(() => {
		unlinkStub = sinon.stub(fs.promises, 'unlink').resolves();
		fakeCollection.removeById.resetHistory();
		fakeCollection.findOne.resetHistory();
	});

	afterEach(() => {
		unlinkStub.restore();
	});

	it('should not throw if file does not exist (ENOENT)', async () => {
		unlinkStub.rejects(Object.assign(new Error('not found'), { code: 'ENOENT' }));
		await expect(store.delete('test')).to.be.fulfilled;
		// unlink is called twice: once for the temp file, once for the actual file
		expect(unlinkStub.calledTwice).to.be.true;
	});

	it('should throw if unlink fails with non-ENOENT error', async () => {
		unlinkStub.rejects(Object.assign(new Error('fail'), { code: 'EACCES' }));
		await expect(store.delete('test')).to.be.rejectedWith('fail');
	});

	it('should call findOne to get file info', async () => {
		await store.delete('test');
		expect(fakeCollection.findOne.calledWith('test')).to.be.true;
	});
});
