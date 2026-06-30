import { expect } from 'chai';
import sinon from 'sinon';
import { afterEach, beforeEach, describe, it, vi } from 'vitest';

// Stubs are built in `vi.hoisted` so the hoisted `vi.mock` factories can reference them. sinon is
// require()d inside the hoisted block because the top-level import has not executed at hoist time.
// NOTE: relative `vi.mock` specifiers are resolved relative to THIS spec file (not the source).
// `match` is exported from the hoisted sinon instance because matchers are instance-specific.
const { modelsMock, sessionMock, clientMock, mergeContactsStub, verifyContactChannelPatch, queueManager, loggerStub, match } = vi.hoisted(
	() => {
		// eslint-disable-next-line @typescript-eslint/no-var-requires
		const sinon = require('sinon');
		const sessionMock = {
			startTransaction: sinon.stub(),
			commitTransaction: sinon.stub(),
			abortTransaction: sinon.stub(),
			endSession: sinon.stub(),
		};
		return {
			modelsMock: {
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
			},
			sessionMock,
			clientMock: {
				startSession: sinon.stub().returns(sessionMock),
			},
			mergeContactsStub: sinon.stub(),
			verifyContactChannelPatch: sinon.stub(),
			queueManager: {
				processNewInquiry: sinon.stub(),
				verifyInquiry: sinon.stub(),
			},
			loggerStub: { info: sinon.stub(), debug: sinon.stub() },
			match: sinon.match,
		};
	},
);

vi.mock('../../../../../../../app/livechat/server/lib/contacts/mergeContacts', () => ({ mergeContacts: mergeContactsStub }));
vi.mock('../../../../../../../app/livechat/server/lib/contacts/verifyContactChannel', () => ({
	verifyContactChannel: { patch: verifyContactChannelPatch },
}));
vi.mock('../../../../../../../app/livechat/server/lib/QueueManager', () => ({ QueueManager: queueManager }));
vi.mock('../../../../../../../server/database/utils', () => ({ client: clientMock }));
vi.mock('../../../../../../app/livechat-enterprise/server/lib/logger', () => ({ contactLogger: loggerStub }));
vi.mock('@rocket.chat/models', () => modelsMock);

const { runVerifyContactChannel } = await import('../../../../../../server/patches/verifyContactChannel');

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
				match({
					visitorId: 'visitorId',
					source: match({
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
				match({
					visitorId: 'visitorId',
					source: match({
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
				match({
					visitorId: 'visitorId',
					source: match({
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
				match({
					visitorId: 'visitorId',
					source: match({
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
				match({
					visitorId: 'visitorId',
					source: match({
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
				match({
					visitorId: 'visitorId',
					source: match({
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
