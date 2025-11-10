import fs from 'fs';

import { expect } from 'chai';
import { before, beforeEach, afterEach, describe, it } from 'mocha';
import proxyquire from 'proxyquire';
import sinon from 'sinon';
import type { SinonStub } from 'sinon';

// import { Config } from './ufs-config';
// import { UploadFS } from './ufs';
import type { LocalStore as LocalStoreClass } from './ufs-local';

const fakeCollection = {
	removeById: sinon.stub(),
	findOne: sinon.stub(),
};

// Proxyquire chain to mock all Meteor dependencies
const ufsFilterMock = proxyquire.noCallThru().load('./ufs-filter', {
	'meteor/meteor': {},
	'meteor/check': {},
	'meteor/mongo': {},
	'meteor/npm-mongo': {},
});

const { UploadFS } = proxyquire.noCallThru().load('./ufs', {
	'meteor/meteor': {},
	'meteor/check': {},
	'meteor/mongo': {},
	'meteor/npm-mongo': {},
	'./ufs-filter': ufsFilterMock,
	'./ufs-store': {
		Store: Object,
	},
});

// Create the UploadFS mock object as a callable function with properties
// function UploadFS() {
// 	return UploadFS;
// }
// Object.assign(UploadFS, {
// 	store: {},
// 	config: new Config(),
// 	addStore: sinon.stub(),
// 	getStore: sinon.stub().returns(undefined),
// 	getTempFilePath: sinon.stub().returns('/tmp/mockfile'),
// });
// The module must export { UploadFS: ... }
const ufsMock = { UploadFS };
const ufsMockModule = { UploadFS };
const ufsIndexMock = { UploadFS };

const ufsStoreMockRaw = proxyquire.noCallThru().load('./ufs-store', {
	'meteor/meteor': {},
	'meteor/check': {},
	'meteor/mongo': {},
	'meteor/npm-mongo': {},
	'./ufs': ufsMockModule,
	'./ufs-filter': ufsFilterMock,
	'./index': ufsIndexMock,
});
// Patch ufsStoreMock to export all possible ways (default, named, etc)
const ufsStoreMock = Object.assign({}, ufsStoreMockRaw, { default: ufsStoreMockRaw, ufsStoreMock: ufsStoreMockRaw });
const localStoreProxy = proxyquire.noCallThru().load('./ufs-local', {
	// 'mkdirp': sinon.stub(),
	'meteor/meteor': {},
	'meteor/check': {},
	'meteor/mongo': {},
	'meteor/npm-mongo': {},
	'./ufs': ufsMock,
	'./ufs-store': ufsStoreMock,
	'./index': ufsIndexMock,
});

const { LocalStore } = localStoreProxy as {
	LocalStore: typeof LocalStoreClass;
};

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
		// Should only call unlink once
		expect(unlinkStub.calledOnce).to.be.true;
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
