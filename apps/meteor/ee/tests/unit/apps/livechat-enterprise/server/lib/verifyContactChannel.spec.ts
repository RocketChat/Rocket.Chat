import { expect } from 'chai';
import proxyquire from 'proxyquire';
import sinon from 'sinon';

const modelsMock = {
	LivechatContacts: {
		findOneById: sinon.stub(),
		updateContact: sinon.stub(),
		findSimilarVerifiedContacts: sinon.stub(),
		deleteMany: sinon.stub(),
	},
	LivechatVisitors: {
		updateMany: sinon.stub(),
	},
	LivechatRooms: {
		update: sinon.stub(),
	},
};

const mergeContactsStub = sinon.stub();

const { runVerifyContactChannel } = proxyquire.noCallThru().load('../../../../../../server/patches/verifyContactChannel', {
	'../../../app/livechat/server/lib/Contacts': { mergeContacts: mergeContactsStub },
	'../../../app/license/client': {
		hasLicense: sinon.stub().resolves(true),
	},
	'@rocket.chat/models': modelsMock,
});

describe('verifyContactChannel', () => {
	beforeEach(() => {
		modelsMock.LivechatContacts.findOneById.reset();
		modelsMock.LivechatContacts.findSimilarVerifiedContacts.reset();
		modelsMock.LivechatContacts.deleteMany.reset();
		modelsMock.LivechatVisitors.updateMany.reset();
		modelsMock.LivechatContacts.updateContact.reset();
		modelsMock.LivechatRooms.update.reset();

		sinon.useFakeTimers(new Date().getTime());
	});

	afterEach(() => {
		sinon.restore();
	});

	it('should be able to verify a contact channel', async () => {
		modelsMock.LivechatContacts.findOneById.resolves({ _id: 'contactId', channels: [{ name: 'channelName', visitorId: 'visitorId' }] });
		modelsMock.LivechatContacts.findSimilarVerifiedContacts.resolves([]);

		await runVerifyContactChannel(() => undefined, {
			contactId: 'contactId',
			field: 'field',
			value: 'value',
			channelName: 'channelName',
			visitorId: 'visitorId',
			roomId: 'roomId',
		});

		expect(modelsMock.LivechatContacts.findOneById.getCall(0).args[0]).to.be.equal('contactId');
		expect(modelsMock.LivechatContacts.updateContact.getCall(0).args[0]).to.be.equal('contactId');
		expect(modelsMock.LivechatContacts.updateContact.getCall(0).args[1]).to.be.deep.contain({
			channels: [
				{
					name: 'channelName',
					visitorId: 'visitorId',
					verified: true,
					verifiedAt: new Date(),
					field: 'field',
					value: 'value',
				},
			],
		});
		expect(modelsMock.LivechatRooms.update.getCall(0).args[0]).to.be.deep.contain({ _id: 'roomId' });
	});

	it('should be able to verify a contact and merge it', async () => {
		modelsMock.LivechatContacts.findOneById.resolves({
			_id: 'contactId',
			emails: ['email1'],
			phones: ['phone1'],
			channels: [{ name: 'channelName', visitorId: 'visitorId' }],
		});
		modelsMock.LivechatContacts.findSimilarVerifiedContacts.resolves([
			{
				_id: 'differentId',
				emails: ['email2'],
				phones: ['phone2'],
				channels: [{ name: 'channelName2', visitorId: 'visitorId2' }],
			},
		]);

		await runVerifyContactChannel(() => undefined, {
			contactId: 'contactId',
			field: 'field',
			value: 'value',
			channelName: 'channelName',
			visitorId: 'visitorId',
			roomId: 'roomId',
		});

		expect(modelsMock.LivechatContacts.updateContact.getCall(1).args[0]).to.be.equal('contactId');
		expect(modelsMock.LivechatContacts.updateContact.getCall(1).args[1]).to.be.deep.contain({
			emails: ['email1', 'email2'],
			phones: ['phone1', 'phone2'],
			channels: [
				{ name: 'channelName2', visitorId: 'visitorId2' },
				{
					name: 'channelName',
					visitorId: 'visitorId',
					verified: true,
					verifiedAt: new Date(),
					field: 'field',
					value: 'value',
				},
			],
		});
		expect(modelsMock.LivechatVisitors.updateMany.getCall(0).args[0]).to.be.deep.equal({ _id: { $in: ['visitorId2'] } });
		expect(modelsMock.LivechatVisitors.updateMany.getCall(0).args[1]).to.be.deep.equal({ $set: { contactId: 'contactId' } });
		expect(modelsMock.LivechatContacts.deleteMany.getCall(0).args[0]).to.be.deep.equal({ _id: { $in: ['differentId'] } });
		expect(modelsMock.LivechatRooms.update.getCall(0).args[0]).to.be.deep.contain({ _id: 'roomId' });
	});

	it('should handle conflicting fields when merging contacts', async () => {
		modelsMock.LivechatContacts.findOneById.resolves({
			_id: 'contactId',
			name: 'name1',
			channels: [{ name: 'channelName', visitorId: 'visitorId' }],
		});
		modelsMock.LivechatContacts.findSimilarVerifiedContacts.resolves([
			{
				_id: 'differentId',
				name: 'name2',
				channels: [{ name: 'channelName2', visitorId: 'visitorId2' }],
			},
		]);

		await runVerifyContactChannel(() => undefined, {
			contactId: 'contactId',
			field: 'field',
			value: 'value',
			channelName: 'channelName',
			visitorId: 'visitorId',
			roomId: 'roomId',
		});

		expect(modelsMock.LivechatContacts.updateContact.getCall(1).args[0]).to.be.equal('contactId');
		expect(modelsMock.LivechatContacts.updateContact.getCall(1).args[1]).to.be.deep.contain({
			hasConflict: true,
			conflictingFields: [
				{
					field: 'name',
					oldValue: 'name1',
					newValue: 'name2',
				},
			],
		});
	});

	it('should throw an error if contact not exists', async () => {
		modelsMock.LivechatContacts.findOneById.resolves(undefined);

		await expect(
			runVerifyContactChannel(() => undefined, {
				contactId: 'invalidId',
				field: 'field',
				value: 'value',
				channelName: 'channelName',
				visitorId: 'visitorId',
				roomId: 'roomId',
			}),
		).to.be.rejectedWith('error-contact-not-found');
	});

	it('should throw an error if contact channel not exists', async () => {
		modelsMock.LivechatContacts.findOneById.resolves({
			_id: 'contactId',
			channels: [{ name: 'channelName', visitorId: 'visitorId' }],
		});

		await expect(
			runVerifyContactChannel(() => undefined, {
				contactId: 'contactId',
				field: 'field',
				value: 'value',
				channelName: 'invalidChannel',
				visitorId: 'invalidVisitor',
				roomId: 'roomId',
			}),
		).to.be.rejectedWith('error-invalid-channel');
	});
});
