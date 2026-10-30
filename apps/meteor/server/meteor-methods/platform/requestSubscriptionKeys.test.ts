import { beforeEach, describe, it } from 'node:test';

import { expect } from 'chai';
import proxyquire from 'proxyquire';
import sinon from 'sinon';

const sandbox = sinon.createSandbox();

const models = {
	Subscriptions: {
		findByUserIdWithoutE2E: sandbox.stub(),
	},
	Rooms: {
		findEncryptedByIdsWithE2eKeyIdAndUserNotQueued: sandbox.stub(),
		addUserIdToE2EEQueueByRoomIds: sandbox.stub(),
	},
	Users: {
		findOneById: sandbox.stub(),
	},
};

const settingsGet = sandbox.stub();
const notifyOnRoomChangedById = sandbox.stub();
const broadcast = sandbox.stub();

const { requestSubscriptionKeysMethod } = proxyquire.noCallThru().load('./requestSubscriptionKeys.ts', {
	'@rocket.chat/models': models,
	'@rocket.chat/core-services': { api: { broadcast } },
	'../../lib/notifyListener': { notifyOnRoomChangedById },
	'../../settings': { settings: { get: settingsGet } },
});

const cursor = <T>(items: T[]) => ({ toArray: sandbox.stub().resolves(items), forEach: (fn: (item: T) => void) => items.forEach(fn) });

describe('requestSubscriptionKeysMethod', () => {
	beforeEach(() => {
		sandbox.resetHistory();
		settingsGet.withArgs('E2E_Enable').returns(true);
		models.Users.findOneById.resolves({ _id: 'uid', e2e: { public_key: 'pub' } });
		models.Subscriptions.findByUserIdWithoutE2E.returns(cursor([{ rid: 'r1' }, { rid: 'r2' }]));
		models.Rooms.findEncryptedByIdsWithE2eKeyIdAndUserNotQueued.returns(cursor([{ _id: 'r1', e2eKeyId: 'k1' }]));
		models.Rooms.addUserIdToE2EEQueueByRoomIds.resolves({ modifiedCount: 1 });
	});

	it('should add the caller to the key queue of encrypted rooms where the caller has no key', async () => {
		await requestSubscriptionKeysMethod('uid');

		expect(models.Rooms.addUserIdToE2EEQueueByRoomIds.calledOnceWithExactly(['r1'], 'uid')).to.be.true;
		expect(notifyOnRoomChangedById.calledOnceWithExactly(['r1'])).to.be.true;
	});

	it('should only look up encrypted rooms with a key that do not have the caller in the queue', async () => {
		await requestSubscriptionKeysMethod('uid');

		expect(
			models.Rooms.findEncryptedByIdsWithE2eKeyIdAndUserNotQueued.calledOnceWithExactly(['r1', 'r2'], 'uid', {
				projection: { _id: 1 },
			}),
		).to.be.true;
	});

	it('should not broadcast the unused key request event', async () => {
		await requestSubscriptionKeysMethod('uid');

		expect(broadcast.called).to.be.false;
	});

	it('should do nothing when E2E encryption is disabled', async () => {
		settingsGet.withArgs('E2E_Enable').returns(false);

		await requestSubscriptionKeysMethod('uid');

		expect(models.Rooms.addUserIdToE2EEQueueByRoomIds.called).to.be.false;
		expect(notifyOnRoomChangedById.called).to.be.false;
	});

	it('should do nothing when the caller has no public key', async () => {
		models.Users.findOneById.resolves({ _id: 'uid' });

		await requestSubscriptionKeysMethod('uid');

		expect(models.Rooms.addUserIdToE2EEQueueByRoomIds.called).to.be.false;
		expect(notifyOnRoomChangedById.called).to.be.false;
	});

	it('should not notify when no room needs the caller in the queue', async () => {
		models.Rooms.findEncryptedByIdsWithE2eKeyIdAndUserNotQueued.returns(cursor([]));

		await requestSubscriptionKeysMethod('uid');

		expect(models.Rooms.addUserIdToE2EEQueueByRoomIds.called).to.be.false;
		expect(notifyOnRoomChangedById.called).to.be.false;
	});

	it('should not notify when the queue did not change', async () => {
		models.Rooms.addUserIdToE2EEQueueByRoomIds.resolves({ modifiedCount: 0 });

		await requestSubscriptionKeysMethod('uid');

		expect(notifyOnRoomChangedById.called).to.be.false;
	});
});
