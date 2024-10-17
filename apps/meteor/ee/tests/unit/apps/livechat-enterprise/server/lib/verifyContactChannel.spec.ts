import { expect } from 'chai';
import proxyquire from 'proxyquire';
import sinon from 'sinon';

const modelsMock = {
	LivechatContacts: {
		updateContactChannel: sinon.stub(),
	},
	LivechatRooms: {
		update: sinon.stub(),
	},
};

const mergeContactsStub = sinon.stub();

const { runVerifyContactChannel } = proxyquire.noCallThru().load('../../../../../../server/patches/verifyContactChannel', {
	'../../../app/livechat/server/lib/Contacts': { mergeContacts: mergeContactsStub, verifyContactChannel: { patch: sinon.stub() } },
	'@rocket.chat/models': modelsMock,
});

describe('verifyContactChannel', () => {
	beforeEach(() => {
		modelsMock.LivechatContacts.updateContactChannel.reset();
		modelsMock.LivechatRooms.update.reset();
	});

	afterEach(() => {
		sinon.restore();
	});

	it('should be able to verify a contact channel', async () => {
		await runVerifyContactChannel(() => undefined, {
			contactId: 'contactId',
			field: 'field',
			value: 'value',
			visitorId: 'visitorId',
			roomId: 'roomId',
		});

		expect(
			modelsMock.LivechatContacts.updateContactChannel.calledOnceWith(
				'contactId',
				'visitorId',
				sinon.match({
					'unknown': false,
					'channels.$.verified': true,
					'channels.$.field': 'field',
					'channels.$.value': 'value',
				}),
			),
		).to.be.true;
		expect(modelsMock.LivechatRooms.update.calledOnceWith({ _id: 'roomId' }, { $set: { verified: true } })).to.be.true;
		expect(mergeContactsStub.calledOnceWith('contactId', 'visitorId'));
	});
});
