import { expect } from 'chai';
import { beforeEach, describe, it } from 'mocha';
import proxyquire from 'proxyquire';
import sinon from 'sinon';

const claimNextDue = sinon.stub();
const requeueStale = sinon.stub();
const setAsSent = sinon.stub();
const setAsFailed = sinon.stub();
const findOneById = sinon.stub();
const executeSendMessage = sinon.stub();

const { dispatchScheduledMessages } = proxyquire.noCallThru().load('./dispatchScheduledMessages', {
	'@rocket.chat/logger': {
		Logger: class Logger {
			public error = sinon.stub();
		},
	},
	'@rocket.chat/models': {
		ScheduledMessages: { claimNextDue, requeueStale, setAsSent, setAsFailed },
		Users: { findOneById },
	},
	'../../../meteor-methods/messages/sendMessage': { executeSendMessage },
	'../../cloud/license/airGappedRestrictionsWrapper': {
		applyAirGappedRestrictionsValidation: (fn: () => Promise<unknown>) => fn(),
	},
});

const pending = {
	_id: 'scheduled-id',
	uid: 'user-id',
	rid: 'room-id',
	msg: 'hello',
};

describe('dispatchScheduledMessages', () => {
	beforeEach(() => {
		sinon.reset();

		requeueStale.resolves();
		setAsSent.resolves();
		setAsFailed.resolves();
		findOneById.resolves({ _id: 'user-id', username: 'user' });
		executeSendMessage.resolves({ _id: 'message-id' });
	});

	it('should requeue claims left behind by a dead instance', async () => {
		claimNextDue.resolves(null);

		await dispatchScheduledMessages();

		expect(requeueStale.calledOnce).to.equal(true);
	});

	it('should send every due message and mark it as sent', async () => {
		claimNextDue.onFirstCall().resolves(pending).onSecondCall().resolves(null);

		await dispatchScheduledMessages();

		expect(executeSendMessage.calledOnce).to.equal(true);
		expect(executeSendMessage.firstCall.args[1]).to.deep.equal({ rid: 'room-id', msg: 'hello' });
		expect(setAsSent.calledWith('scheduled-id', 'message-id')).to.equal(true);
	});

	it('should forward thread information when present', async () => {
		claimNextDue
			.onFirstCall()
			.resolves({ ...pending, tmid: 'thread-id', tshow: true })
			.onSecondCall()
			.resolves(null);

		await dispatchScheduledMessages();

		expect(executeSendMessage.firstCall.args[1]).to.deep.equal({
			rid: 'room-id',
			msg: 'hello',
			tmid: 'thread-id',
			tshow: true,
		});
	});

	it('should mark a message as failed when delivery throws, without aborting the run', async () => {
		claimNextDue
			.onFirstCall()
			.resolves(pending)
			.onSecondCall()
			.resolves({ ...pending, _id: 'other-id' })
			.onThirdCall()
			.resolves(null);
		executeSendMessage.onFirstCall().rejects(new Error('error-not-allowed'));

		await dispatchScheduledMessages();

		expect(setAsFailed.calledWith('scheduled-id', 'error-not-allowed')).to.equal(true);
		expect(setAsSent.calledWith('other-id', 'message-id')).to.equal(true);
	});

	it('should fail a message whose author no longer exists', async () => {
		claimNextDue.onFirstCall().resolves(pending).onSecondCall().resolves(null);
		findOneById.resolves(null);

		await dispatchScheduledMessages();

		expect(executeSendMessage.called).to.equal(false);
		expect(setAsFailed.calledWith('scheduled-id', 'error-invalid-user')).to.equal(true);
	});

	it('should stop after the per-run cap so a backlog does not hold the cron slot', async () => {
		claimNextDue.resolves(pending);

		await dispatchScheduledMessages();

		expect(claimNextDue.callCount).to.equal(100);
	});
});
