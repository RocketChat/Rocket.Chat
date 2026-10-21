import { expect } from 'chai';
import { describe, it, beforeEach } from 'mocha';
import proxyquire from 'proxyquire';
import sinon from 'sinon';

const findOneBySubscriptionIdStub = sinon.stub();

const { processGraphNotifications } = proxyquire.noCallThru().load('../../../../../ee/server/lib/calendarSync/webhooks.ts', {
	'@rocket.chat/models': {
		CalendarSyncState: { findOneBySubscriptionId: findOneBySubscriptionIdStub },
	},
});

const silentLogger = { warn: () => undefined, error: () => undefined };

describe('calendarSync/webhooks', () => {
	let syncUserById: sinon.SinonStub;

	beforeEach(() => {
		findOneBySubscriptionIdStub.reset();
		findOneBySubscriptionIdStub.resolves(null);
		syncUserById = sinon.stub().resolves(true);
	});

	it('should re-sync the user for an authenticated notification', async () => {
		findOneBySubscriptionIdStub.withArgs('sub-1').resolves({ uid: 'u1', subscriptionClientState: 'secret-1' });

		await processGraphNotifications({ value: [{ subscriptionId: 'sub-1', clientState: 'secret-1' }] }, { syncUserById }, silentLogger);

		expect(syncUserById.calledOnceWith('u1')).to.be.true;
	});

	it('should dedupe multiple notifications for the same user', async () => {
		findOneBySubscriptionIdStub.withArgs('sub-1').resolves({ uid: 'u1', subscriptionClientState: 'secret-1' });

		await processGraphNotifications(
			{
				value: [
					{ subscriptionId: 'sub-1', clientState: 'secret-1' },
					{ subscriptionId: 'sub-1', clientState: 'secret-1' },
				],
			},
			{ syncUserById },
			silentLogger,
		);

		expect(syncUserById.calledOnce).to.be.true;
	});

	it('should drop notifications with a mismatched clientState', async () => {
		findOneBySubscriptionIdStub.withArgs('sub-1').resolves({ uid: 'u1', subscriptionClientState: 'secret-1' });

		await processGraphNotifications({ value: [{ subscriptionId: 'sub-1', clientState: 'forged' }] }, { syncUserById }, silentLogger);

		expect(syncUserById.called).to.be.false;
	});

	it('should ignore unknown subscriptions and malformed payloads without throwing', async () => {
		await processGraphNotifications({ value: [{ subscriptionId: 'unknown', clientState: 'x' }] }, { syncUserById }, silentLogger);
		await processGraphNotifications({} as any, { syncUserById }, silentLogger);
		await processGraphNotifications({ value: [{}] } as any, { syncUserById }, silentLogger);

		expect(syncUserById.called).to.be.false;
	});

	it('should keep processing other users when one sync fails', async () => {
		findOneBySubscriptionIdStub.withArgs('sub-1').resolves({ uid: 'u1', subscriptionClientState: 's1' });
		findOneBySubscriptionIdStub.withArgs('sub-2').resolves({ uid: 'u2', subscriptionClientState: 's2' });
		syncUserById.withArgs('u1').rejects(new Error('boom'));

		await processGraphNotifications(
			{
				value: [
					{ subscriptionId: 'sub-1', clientState: 's1' },
					{ subscriptionId: 'sub-2', clientState: 's2' },
				],
			},
			{ syncUserById },
			silentLogger,
		);

		expect(syncUserById.calledWith('u2')).to.be.true;
	});
});
