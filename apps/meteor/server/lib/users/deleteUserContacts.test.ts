import { beforeEach, describe, it } from 'node:test';

import { mockModel } from '@rocket.chat/models/testing';
import { expect } from 'chai';
import proxyquire from 'proxyquire';
import sinon from 'sinon';

const deleteFromStore = sinon.stub();

const { deleteUserContacts } = proxyquire.noCallThru().load('./deleteUserContacts', {
	'../media/file-upload': { FileUpload: { getStoreByName: () => ({ delete: deleteFromStore }) } },
});

describe('deleteUserContacts', () => {
	let Contacts: Record<string, sinon.SinonStub>;
	let ExchangeContactSyncState: Record<string, sinon.SinonStub>;
	let Avatars: Record<string, sinon.SinonStub>;

	beforeEach(() => {
		Contacts = {
			deleteByUserId: sinon.stub(),
		};
		ExchangeContactSyncState = {
			deleteByUserId: sinon.stub(),
		};
		Avatars = {
			findContactAvatarsByUserId: sinon.stub().returns([
				{ _id: 'unreachable', store: 'AmazonS3:Avatars' },
				{ _id: 'reachable', store: 'GridFS:Avatars' },
			]),
		};
		mockModel('Contacts', Contacts);
		mockModel('ExchangeContactSyncState', ExchangeContactSyncState);
		mockModel('Avatars', Avatars);
		deleteFromStore.reset();
	});

	it('deletes the contacts and sync state, and keeps deleting avatars when one of them cannot be deleted', async () => {
		deleteFromStore.withArgs('unreachable').rejects(new Error('network down'));

		await deleteUserContacts('uid');

		expect(Contacts.deleteByUserId.calledOnceWith('uid')).to.be.true;
		expect(ExchangeContactSyncState.deleteByUserId.calledOnceWith('uid')).to.be.true;
		expect(Avatars.findContactAvatarsByUserId.calledOnceWithExactly('uid', { projection: { _id: 1, store: 1 } })).to.be.true;
		expect(Avatars.findContactAvatarsByUserId.calledAfter(Contacts.deleteByUserId)).to.be.true;
		expect(deleteFromStore.calledWith('unreachable')).to.be.true;
		expect(deleteFromStore.calledWith('reachable')).to.be.true;
	});
});
