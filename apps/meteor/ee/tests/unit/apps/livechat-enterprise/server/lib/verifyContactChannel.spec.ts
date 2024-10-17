import { expect } from 'chai';
import proxyquire from 'proxyquire';
import sinon from 'sinon';

const modelsMock = {
	LivechatContacts: {
		findOneById: sinon.stub(),
		updateContact: sinon.stub(),
	},
	LivechatRooms: {
		update: sinon.stub(),
	},
};

const mergeContactsStub = sinon.stub();

const { runVerifyContactChannel } = proxyquire.noCallThru().load('../../../../../../server/patches/verifyContactChannel', {
	'../../../app/livechat/server/lib/Contacts': { mergeContacts: mergeContactsStub },
	'@rocket.chat/models': modelsMock,
});

describe('verifyContactChannel', () => {
	beforeEach(() => {
		modelsMock.LivechatContacts.findOneById.reset();
		modelsMock.LivechatContacts.updateContact.reset();
		modelsMock.LivechatRooms.update.reset();
	});

	afterEach(() => {
		sinon.restore();
	});

	it('should be able to verify a contact channel', async () => {
		modelsMock.LivechatContacts.findOneById.resolves({ _id: 'contactId', channels: [{ name: 'channelName', visitorId: 'visitorId' }] });

		await runVerifyContactChannel(() => undefined, {
			contactId: 'contactId',
			field: 'field',
			value: 'value',
			channelName: 'channelName',
			visitorId: 'visitorId',
			roomId: 'roomId',
		});

		expect(modelsMock.LivechatContacts.findOneById.calledOnceWith('contactId')).to.be.true;
		expect(
			modelsMock.LivechatContacts.updateContact.calledOnceWith('contactId', {
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
			}),
		).to.be.true;
		expect(modelsMock.LivechatRooms.update.calledOnceWith({ _id: 'roomId' }, { $set: { verified: true } })).to.be.true;
		expect(mergeContactsStub.calledOnceWith('contactId', { name: 'channelName', visitorId: 'visitorId' }));
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
