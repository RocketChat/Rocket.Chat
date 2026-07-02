import { expect } from 'chai';
import sinon from 'sinon';
import { beforeAll, beforeEach, describe, it, vi } from 'vitest';

import type { LocalStore as LocalStoreClass } from './ufs-local';

// `LocalStore.delete` calls `unlink` imported from 'node:fs/promises'. Stub it via vi.mock (the original
// stubbed `fs.promises.unlink`, which under Vitest's node-builtin interop is a different reference than
// the source's named import). The stub lives in vi.hoisted so the hoisted mock factory can reference it.
const { unlinkStub } = vi.hoisted(() => {
	// eslint-disable-next-line @typescript-eslint/no-var-requires
	const sinon = require('sinon');
	return { unlinkStub: sinon.stub() };
});

// `delete` unlinks the real file via `unlink` from 'node:fs/promises', and `removeById` unlinks the temp
// file via `fs.promises.unlink` from 'node:fs' — two call sites that the test counts together (calledTwice).
// Point both at the same stub (under Mocha they were the same object; under Vitest each builtin is mocked
// separately). Everything else in node:fs (chmod/createReadStream/… used during construction) stays real.
vi.mock('node:fs/promises', async (importOriginal) => {
	const actual = await importOriginal<typeof import('node:fs/promises')>();
	return { ...actual, default: { ...actual, unlink: unlinkStub }, unlink: unlinkStub };
});

vi.mock('node:fs', async (importOriginal) => {
	const actual = await importOriginal<typeof import('node:fs')>();
	const realFs = (actual as any).default ?? actual;
	const patched = { ...realFs, promises: { ...realFs.promises, unlink: unlinkStub } };
	return { ...patched, default: patched };
});

// The Meteor virtual modules pulled in transitively by the real UFS chain (ufs-local → ufs-store →
// ufs/ufs-filter) are stubbed so the real classes load without a Meteor runtime — the same thing the
// original proxyquire chain did, now expressed as plain module mocks.
vi.mock('meteor/meteor', () => ({ Meteor: {} }));
vi.mock('meteor/check', () => ({ check: () => undefined }));
vi.mock('meteor/mongo', () => ({}));
vi.mock('meteor/npm-mongo', () => ({}));
// The barrel `./index` eagerly loads ufs-server/ufs-methods/ufs-gridfs (which import meteor/webapp etc.).
// ufs-store only needs a few UploadFS helpers from it, so stub the barrel to avoid that chain — the same
// thing the original proxyquire `./index` mock did.
vi.mock('./index', () => ({
	UploadFS: {
		store: {},
		config: { storesPath: 'ufs', https: false },
		getStore: () => undefined,
		addStore: () => undefined,
		getTempFilePath: () => '/tmp/mockfile',
	},
}));

const { LocalStore } = await import('./ufs-local');

const fakeCollection = {
	removeById: sinon.stub(),
	findOne: sinon.stub(),
};

describe('LocalStore', () => {
	let store: LocalStoreClass;

	beforeAll(() => {
		fakeCollection.removeById.resolves();
		fakeCollection.findOne.resolves({ _id: 'test', name: 'file.txt' });
		store = new LocalStore({ name: 'test', collection: fakeCollection as any, path: '/tmp/ufs-local' });
	});

	beforeEach(() => {
		unlinkStub.reset();
		unlinkStub.resolves();
		fakeCollection.removeById.resetHistory();
		fakeCollection.findOne.resetHistory();
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
