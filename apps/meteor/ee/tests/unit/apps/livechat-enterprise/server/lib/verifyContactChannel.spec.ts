import { expect } from 'chai';
import proxyquire from 'proxyquire';
import sinon from 'sinon';

const modelsMock = {
	LivechatContacts: {
		getUpdater: sinon.stub(),
		setVerifiedUpdateQuery: sinon.stub(),
		setFieldAndValueUpdateQuery: sinon.stub(),
		updateFromUpdaterByAssociation: sinon.stub(),
	},
	LivechatRooms: {
		update: sinon.stub(),
		findOneById: sinon.stub(),
	},
	LivechatInquiry: {
		findOneByRoomId: sinon.stub(),
		saveQueueInquiry: sinon.stub(),
	},
};

const sessionMock = {
	startTransaction: sinon.stub(),
	commitTransaction: sinon.stub(),
	abortTransaction: sinon.stub(),
	endSession: sinon.stub(),
};

const clientMock = {
	startSession: sinon.stub().returns(sessionMock),
};

const mergeContactsStub = sinon.stub();
const queueManager = {
	processNewInquiry: sinon.stub(),
	verifyInquiry: sinon.stub(),
};

const { runVerifyContactChannel } = proxyquire.noCallThru().load('../../../../../../server/patches/verifyContactChannel', {
	'../../../app/livechat/server/lib/contacts/mergeContacts': { mergeContacts: mergeContactsStub },
	'../../../app/livechat/server/lib/contacts/verifyContactChannel': { verifyContactChannel: { patch: sinon.stub() } },
	'../../../app/livechat/server/lib/QueueManager': { QueueManager: queueManager },
	'../../../server/database/utils': { client: clientMock },
	'../../../app/livechat-enterprise/server/lib/logger': { logger: { info: sinon.stub(), debug: sinon.stub() } },
	'@rocket.chat/models': modelsMock,
});

describe('verifyContactChannel', () => {
	beforeEach(() => {
		modelsMock.LivechatContacts.getUpdater.reset();
		modelsMock.LivechatContacts.setVerifiedUpdateQuery.reset();
		modelsMock.LivechatContacts.setFieldAndValueUpdateQuery.reset();
		modelsMock.LivechatContacts.updateFromUpdaterByAssociation.reset();
		modelsMock.LivechatRooms.update.reset();
		modelsMock.LivechatInquiry.findOneByRoomId.reset();
		modelsMock.LivechatRooms.findOneById.reset();
		sessionMock.startTransaction.reset();
		sessionMock.commitTransaction.reset();
		sessionMock.abortTransaction.reset();
		sessionMock.endSession.reset();
		mergeContactsStub.reset();
		queueManager.processNewInquiry.reset();
		queueManager.verifyInquiry.reset();

		modelsMock.LivechatContacts.getUpdater.returns({});
	});

	afterEach(() => {
		sinon.restore();
	});

	it('should be able to verify a contact channel', async () => {
		modelsMock.LivechatInquiry.findOneByRoomId.resolves({ _id: 'inquiryId', status: 'verifying' });
		modelsMock.LivechatRooms.findOneById.resolves({ _id: 'roomId', source: { type: 'sms' } });
		mergeContactsStub.resolves({ _id: 'contactId' });
		await runVerifyContactChannel(() => undefined, {
			contactId: 'contactId',
			field: 'field',
			value: 'Value',
			visitorId: 'visitorId',
			roomId: 'roomId',
		});

		expect(modelsMock.LivechatContacts.getUpdater.calledOnce).to.be.true;
		expect(modelsMock.LivechatContacts.setVerifiedUpdateQuery.calledOnceWith(true, {})).to.be.true;
		expect(modelsMock.LivechatContacts.setFieldAndValueUpdateQuery.calledOnceWith('field', 'value', {})).to.be.true;
		expect(
			modelsMock.LivechatContacts.updateFromUpdaterByAssociation.calledOnceWith(
				sinon.match({
					visitorId: 'visitorId',
					source: sinon.match({
						type: 'sms',
					}),
				}),
				{},
			),
		).to.be.true;
		expect(modelsMock.LivechatRooms.update.calledOnceWith({ _id: 'roomId' }, { $set: { verified: true } })).to.be.true;
		expect(
			mergeContactsStub.calledOnceWith(
				'contactId',
				sinon.match({
					visitorId: 'visitorId',
					source: sinon.match({
						type: 'sms',
					}),
				}),
			),
		).to.be.true;
		expect(queueManager.verifyInquiry.calledOnceWith({ _id: 'inquiryId', status: 'verifying' }, { _id: 'roomId', source: { type: 'sms' } }))
			.to.be.true;
	});

	it('should not add inquiry if status is not ready', async () => {
		modelsMock.LivechatInquiry.findOneByRoomId.resolves({ _id: 'inquiryId', status: 'taken' });
		modelsMock.LivechatRooms.findOneById.resolves({ _id: 'roomId', source: { type: 'sms' } });
		mergeContactsStub.resolves({ _id: 'contactId' });
		await runVerifyContactChannel(() => undefined, {
			contactId: 'contactId',
			field: 'field',
			value: 'value',
			visitorId: 'visitorId',
			roomId: 'roomId',
		});

		expect(modelsMock.LivechatContacts.getUpdater.calledOnce).to.be.true;
		expect(modelsMock.LivechatContacts.setVerifiedUpdateQuery.calledOnceWith(true, {})).to.be.true;
		expect(modelsMock.LivechatContacts.setFieldAndValueUpdateQuery.calledOnceWith('field', 'value', {})).to.be.true;
		expect(
			modelsMock.LivechatContacts.updateFromUpdaterByAssociation.calledOnceWith(
				sinon.match({
					visitorId: 'visitorId',
					source: sinon.match({
						type: 'sms',
					}),
				}),
				{},
			),
		).to.be.true;

		expect(modelsMock.LivechatRooms.update.calledOnceWith({ _id: 'roomId' }, { $set: { verified: true } })).to.be.true;
		expect(
			mergeContactsStub.calledOnceWith(
				'contactId',
				sinon.match({
					visitorId: 'visitorId',
					source: sinon.match({
						type: 'sms',
					}),
				}),
			),
		).to.be.true;
		expect(queueManager.verifyInquiry.calledOnceWith({ _id: 'inquiryId', status: 'ready' }, { _id: 'roomId', source: { type: 'sms' } })).to
			.be.false;
	});

	it('should fail if no matching room is found', async () => {
		modelsMock.LivechatInquiry.findOneByRoomId.resolves(undefined);
		modelsMock.LivechatRooms.findOneById.resolves(undefined);
		await expect(
			runVerifyContactChannel(() => undefined, {
				contactId: 'contactId',
				field: 'field',
				value: 'value',
				visitorId: 'visitorId',
				roomId: 'roomId',
			}),
		).to.be.rejectedWith('error-invalid-room');

		expect(modelsMock.LivechatContacts.getUpdater.notCalled).to.be.true;
		expect(modelsMock.LivechatContacts.setVerifiedUpdateQuery.notCalled).to.be.true;
		expect(modelsMock.LivechatContacts.setFieldAndValueUpdateQuery.notCalled).to.be.true;
		expect(modelsMock.LivechatContacts.updateFromUpdaterByAssociation.notCalled).to.be.true;

		expect(modelsMock.LivechatRooms.update.notCalled).to.be.true;
		expect(mergeContactsStub.notCalled).to.be.true;
		expect(queueManager.verifyInquiry.notCalled).to.be.true;
	});

	it('should fail if no matching inquiry is found', async () => {
		modelsMock.LivechatInquiry.findOneByRoomId.resolves(undefined);
		modelsMock.LivechatRooms.findOneById.resolves({ _id: 'roomId', source: { type: 'sms' } });
		mergeContactsStub.resolves({ _id: 'contactId' });
		await expect(
			runVerifyContactChannel(() => undefined, {
				contactId: 'contactId',
				field: 'field',
				value: 'value',
				visitorId: 'visitorId',
				roomId: 'roomId',
			}),
		).to.be.rejectedWith('error-invalid-inquiry');

		expect(modelsMock.LivechatContacts.getUpdater.calledOnce).to.be.true;
		expect(modelsMock.LivechatContacts.setVerifiedUpdateQuery.calledOnceWith(true, {})).to.be.true;
		expect(modelsMock.LivechatContacts.setFieldAndValueUpdateQuery.calledOnceWith('field', 'value', {})).to.be.true;
		expect(
			modelsMock.LivechatContacts.updateFromUpdaterByAssociation.calledOnceWith(
				sinon.match({
					visitorId: 'visitorId',
					source: sinon.match({
						type: 'sms',
					}),
				}),
				{},
			),
		).to.be.true;

		expect(modelsMock.LivechatRooms.update.calledOnceWith({ _id: 'roomId' }, { $set: { verified: true } })).to.be.true;
		expect(
			mergeContactsStub.calledOnceWith(
				'contactId',
				sinon.match({
					visitorId: 'visitorId',
					source: sinon.match({
						type: 'sms',
					}),
				}),
			),
		).to.be.true;
		expect(queueManager.verifyInquiry.notCalled).to.be.true;
	});

	it('should abort transaction if an error occurs', async () => {
		modelsMock.LivechatInquiry.findOneByRoomId.resolves({ _id: 'inquiryId' });
		modelsMock.LivechatRooms.findOneById.resolves({ _id: 'roomId', source: { type: 'sms' } });
		mergeContactsStub.rejects();
		await expect(
			runVerifyContactChannel(() => undefined, {
				contactId: 'contactId',
				field: 'field',
				value: 'value',
				visitorId: 'visitorId',
				roomId: 'roomId',
			}),
		).to.be.rejected;

		expect(sessionMock.abortTransaction.calledOnce).to.be.true;
		expect(sessionMock.commitTransaction.notCalled).to.be.true;
		expect(sessionMock.endSession.calledOnce).to.be.true;
	});
});
