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
	LivechatInquiry: {
		findOneReadyByContactId: sinon.stub(),
		saveQueueInquiry: sinon.stub(),
	},
};

const mergeContactsStub = sinon.stub();
const saveQueueInquiryStub = sinon.stub();

const { runVerifyContactChannel } = proxyquire.noCallThru().load('../../../../../../server/patches/verifyContactChannel', {
	'../../../app/livechat/server/lib/contacts/mergeContacts': { mergeContacts: mergeContactsStub },
	'../../../app/livechat/server/lib/contacts/verifyContactChannel': { verifyContactChannel: { patch: sinon.stub() } },
	'../../../app/livechat/server/lib/QueueManager': { saveQueueInquiry: saveQueueInquiryStub },
	'@rocket.chat/models': modelsMock,
});

describe('verifyContactChannel', () => {
	beforeEach(() => {
		modelsMock.LivechatContacts.updateContactChannel.reset();
		modelsMock.LivechatRooms.update.reset();
		modelsMock.LivechatInquiry.findOneReadyByContactId.reset();
		mergeContactsStub.reset();
		saveQueueInquiryStub.reset();
	});

	afterEach(() => {
		sinon.restore();
	});

	it('should be able to verify a contact channel', async () => {
		modelsMock.LivechatInquiry.findOneReadyByContactId.resolves({ _id: 'inquiryId' });
		await runVerifyContactChannel(() => undefined, {
			contactId: 'contactId',
			field: 'field',
			value: 'value',
			visitorId: 'visitorId',
			roomId: 'roomId',
		});

		expect(
			modelsMock.LivechatContacts.updateContactChannel.calledOnceWith(
				'visitorId',
				sinon.match({
					verified: true,
					field: 'field',
					value: 'value',
				}),
				sinon.match({
					unknown: false,
				}),
			),
		).to.be.true;
		expect(modelsMock.LivechatRooms.update.calledOnceWith({ _id: 'roomId' }, { $set: { verified: true } })).to.be.true;
		expect(mergeContactsStub.calledOnceWith('contactId', 'visitorId')).to.be.true;
		expect(saveQueueInquiryStub.calledOnceWith({ _id: 'inquiryId' })).to.be.true;
	});
	it('should fail if no matching inquiry is found', async () => {
		modelsMock.LivechatInquiry.findOneReadyByContactId.resolves(undefined);
		await expect(
			runVerifyContactChannel(() => undefined, {
				contactId: 'contactId',
				field: 'field',
				value: 'value',
				visitorId: 'visitorId',
				roomId: 'roomId',
			}),
		).to.be.rejectedWith('error-invalid-inquiry');

		expect(
			modelsMock.LivechatContacts.updateContactChannel.calledOnceWith(
				'visitorId',
				sinon.match({
					verified: true,
					field: 'field',
					value: 'value',
				}),
				sinon.match({
					unknown: false,
				}),
			),
		).to.be.true;
		expect(modelsMock.LivechatRooms.update.calledOnceWith({ _id: 'roomId' }, { $set: { verified: true } })).to.be.true;
		expect(mergeContactsStub.calledOnceWith('contactId', 'visitorId')).to.be.true;
		expect(saveQueueInquiryStub.notCalled).to.be.true;
	});
});
