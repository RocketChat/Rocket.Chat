import type { ILivechatInquiryRecord, ILivechatVisitor, IOmnichannelRoom, SelectedAgent } from '@rocket.chat/core-typings';
import { LivechatInquiryStatus, OmnichannelSourceType } from '@rocket.chat/core-typings';
import { expect } from 'chai';
import { MongoError, MongoTransactionError } from 'mongodb';
import proxyquire from 'proxyquire';
import sinon from 'sinon';

import { createFakeOmnichannelRoom } from '../../../tests/mocks/data';

// Mirrors the mongodb driver's ClientSession rules that startConversation depends on.
class FakeSession {
	private started = false;

	private commitAttempted = false;

	committed = false;

	aborted = false;

	ended = false;

	constructor(private readonly commitError?: Error) {}

	startTransaction() {
		this.started = true;
	}

	async commitTransaction() {
		if (!this.started) {
			throw new MongoTransactionError('No transaction started');
		}
		this.commitAttempted = true;
		if (this.commitError) {
			throw this.commitError;
		}
		this.committed = true;
	}

	// The driver refuses to abort once a commit was attempted, even a failed one.
	async abortTransaction() {
		if (!this.started) {
			throw new MongoTransactionError('No transaction started');
		}
		if (this.commitAttempted) {
			throw new MongoTransactionError('Cannot call abortTransaction after calling commitTransaction');
		}
		this.aborted = true;
	}

	async endSession() {
		this.ended = true;
	}
}

let sessions: FakeSession[] = [];
let commitErrors: (Error | undefined)[] = [];

const client = {
	startSession: () => {
		const session = new FakeSession(commitErrors.shift());
		sessions.push(session);
		return session;
	},
};

const helperMocks = {
	createLivechatRoom: sinon.stub(),
	createLivechatInquiry: sinon.stub(),
};

const { QueueManager } = proxyquire.noCallThru().load('./QueueManager', {
	'meteor/check': {},
	'meteor/meteor': {},
	'meteor/mongo': {
		'MongoInternals': { defaultRemoteCollectionDriver: () => ({ mongo: { client } }) },
		'@global': true,
	},
	'./Helper': helperMocks,
	'./RoutingManager': {},
	'./departmentsLib': {},
	'./hooks': {},
	'./service-status': {},
	'./settings': {},
	'../../../ee/server/lib/omnichannel/Helper': {},
	'../../hooks/messages/sendNotificationsOnMessage': {},
	'../../settings': {},
});

QueueManager.patchInquiryStatus(async ({ agent }: { agent?: SelectedAgent }) =>
	agent ? LivechatInquiryStatus.READY : LivechatInquiryStatus.QUEUED,
);

const transientError = (label: 'TransientTransactionError' | 'UnknownTransactionCommitResult') => {
	const error = new MongoError(label);
	error.addErrorLabel(label);
	return error;
};

const guest = { _id: 'visitor-id', username: 'guest-1', token: 'visitor-token' } as ILivechatVisitor;
const roomInfo = { source: { type: OmnichannelSourceType.WIDGET } };
const defaultAgent = { agentId: 'agent-id', username: 'agent' };

const startConversation = (): Promise<{ room: IOmnichannelRoom; inquiry: ILivechatInquiryRecord }> =>
	QueueManager.startConversation('rid', {}, guest, roomInfo, defaultAgent, 'hello');

const expectedInquiry = {
	rid: 'rid',
	name: 'Guest 1',
	guest,
	message: 'hello',
	initialStatus: LivechatInquiryStatus.READY,
	extraData: { source: roomInfo.source },
};

describe('QueueManager.startConversation', () => {
	beforeEach(() => {
		sessions = [];
		helperMocks.createLivechatRoom.reset();
		helperMocks.createLivechatInquiry.reset();
		helperMocks.createLivechatRoom.callsFake(async () => createFakeOmnichannelRoom({ _id: 'rid', fname: 'Guest 1' }));
		helperMocks.createLivechatInquiry.callsFake(async ({ rid }) => ({ _id: `inquiry-${sessions.length}`, rid }));
	});

	it('should commit the room and the inquiry in one transaction and return both', async () => {
		const { room, inquiry } = await startConversation();

		expect(room._id).to.equal('rid');
		expect(inquiry).to.deep.equal({ _id: 'inquiry-1', rid: 'rid' });
		expect(sessions).to.have.lengthOf(1);
		const [session] = sessions;
		expect(helperMocks.createLivechatRoom.firstCall.args[1]).to.equal(session);
		expect(helperMocks.createLivechatInquiry.firstCall.args[0]).to.deep.equal({ ...expectedInquiry, session });
		expect(session).to.include({ committed: true, aborted: false, ended: true });
	});

	it('should roll back the room and rethrow when the inquiry cannot be created', async () => {
		const error = new Error('Inquiry not created');
		helperMocks.createLivechatInquiry.rejects(error);

		await expect(startConversation()).to.be.rejectedWith(error);

		expect(sessions).to.have.lengthOf(1);
		expect(sessions[0]).to.include({ committed: false, aborted: true, ended: true });
	});

	it('should retry a transient failure and return the conversation from the retry', async () => {
		helperMocks.createLivechatInquiry.onFirstCall().rejects(transientError('TransientTransactionError'));

		const { inquiry } = await startConversation();

		expect(inquiry._id).to.equal('inquiry-2');
		expect(sessions).to.have.lengthOf(2);
		expect(helperMocks.createLivechatInquiry.secondCall.args[0]).to.deep.equal({ ...expectedInquiry, session: sessions[1] });
		expect(sessions[0]).to.include({ committed: false, aborted: true, ended: true });
		expect(sessions[1]).to.include({ committed: true, aborted: false, ended: true });
	});

	it('should throw error-failed-to-start-conversation after three transient retries', async () => {
		helperMocks.createLivechatInquiry.rejects(transientError('TransientTransactionError'));

		await expect(startConversation()).to.be.rejectedWith('error-failed-to-start-conversation');

		expect(sessions).to.have.lengthOf(4);
		for (const session of sessions) {
			expect(session).to.include({ committed: false, aborted: true, ended: true });
		}
	});

	it('should reject with the abort error and not retry when the commit fails', async () => {
		commitErrors = [transientError('UnknownTransactionCommitResult')];

		await expect(startConversation()).to.be.rejectedWith(
			MongoTransactionError,
			'Cannot call abortTransaction after calling commitTransaction',
		);

		expect(sessions).to.have.lengthOf(1);
		expect(sessions[0]).to.include({ committed: false, ended: true });
	});
});
