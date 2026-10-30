import assert from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';

import { expect } from 'chai';
import { MongoClient, MongoServerError } from 'mongodb';
import proxyquire from 'proxyquire';
import sinon from 'sinon';

const canAccessRoomIdAsync = sinon.stub();
const updateGroupKey = sinon.stub();
const notifyOnRoomChanged = sinon.stub();
const notifyOnRoomChangedById = sinon.stub();
const notifyOnSubscriptionChanged = sinon.stub();
const session = {
	withTransaction: sinon.stub(),
	abortTransaction: sinon.stub(),
	endSession: sinon.stub(),
};
const startSession = sinon.stub();
const models = {
	Rooms: {
		findOneById: sinon.stub(),
		setE2eKeyId: sinon.stub(),
		removeUsersFromE2EEQueueByRoomId: sinon.stub(),
	},
	Subscriptions: {
		findOneById: sinon.stub(),
		findOneByRoomIdAndUserId: sinon.stub(),
		setGroupE2EKey: sinon.stub(),
	},
};

const { setRoomKeyIDMethod } = proxyquire.noCallThru().load('./setRoomKeyID.ts', {
	'@rocket.chat/core-services': {
		ClientSafeError: class extends Error {
			constructor(public error: string) {
				super(error);
			}
		},
	},
	'@rocket.chat/models': models,
	'../../database/utils': { client: { startSession } },
	'../../lib/authorization/canAccessRoom': { canAccessRoomIdAsync },
	'../../lib/notifyListener': { notifyOnRoomChanged, notifyOnRoomChangedById, notifyOnSubscriptionChanged },
	'./updateGroupKey': { updateGroupKey },
});

const expectNoNotifications = () => {
	expect(notifyOnRoomChanged.called).to.be.false;
	expect(notifyOnRoomChangedById.called).to.be.false;
	expect(notifyOnSubscriptionChanged.called).to.be.false;
};

describe('setRoomKeyIDMethod', () => {
	beforeEach(() => {
		for (const stub of [
			canAccessRoomIdAsync,
			updateGroupKey,
			notifyOnRoomChanged,
			notifyOnRoomChangedById,
			notifyOnSubscriptionChanged,
			startSession,
			...Object.values(session),
			...Object.values(models.Rooms),
			...Object.values(models.Subscriptions),
		]) {
			stub.reset();
		}
		canAccessRoomIdAsync.resolves(true);
		startSession.returns(session);
		session.endSession.resolves();
		session.abortTransaction.resolves();
		session.withTransaction.callsFake(async (callback) => {
			try {
				return await callback(session);
			} catch (error) {
				await session.abortTransaction();
				throw error;
			}
		});
		models.Rooms.findOneById.resolves({ _id: 'rid', e2eKeyId: 'kid' });
		models.Subscriptions.findOneById.resolves({ _id: 'sid', rid: 'rid', E2EKey: 'kid-encrypted-key' });
		models.Rooms.setE2eKeyId.resolves({ _id: 'rid', e2eKeyId: 'kid' });
		models.Subscriptions.findOneByRoomIdAndUserId.resolves({ _id: 'sid', rid: 'rid' });
		models.Subscriptions.setGroupE2EKey.resolves({ matchedCount: 1, modifiedCount: 1 });
		models.Rooms.removeUsersFromE2EEQueueByRoomId.resolves({ modifiedCount: 1 });
	});

	it('saves the key ID, creator key, and queue changes in the same transaction', async () => {
		await setRoomKeyIDMethod('uid', 'rid', 'kid', 'kid-encrypted-key');

		expect(models.Subscriptions.findOneByRoomIdAndUserId.calledOnceWithExactly('rid', 'uid', { session })).to.be.true;
		expect(models.Rooms.setE2eKeyId.calledOnceWithExactly('rid', 'kid', { session })).to.be.true;
		expect(models.Subscriptions.setGroupE2EKey.calledOnceWithExactly('sid', 'kid-encrypted-key', { session })).to.be.true;
		expect(models.Rooms.removeUsersFromE2EEQueueByRoomId.calledOnceWithExactly('rid', ['uid'], { session })).to.be.true;
		expect(updateGroupKey.called).to.be.false;
		expect(session.endSession.calledOnce).to.be.true;
	});

	it('does not notify before commit, including when the driver retries the callback', async () => {
		let committed = false;
		session.withTransaction.callsFake(async (callback) => {
			await callback(session);
			expectNoNotifications();
			const result = await callback(session);
			expectNoNotifications();
			committed = true;
			return result;
		});
		notifyOnRoomChanged.callsFake(() => expect(committed).to.be.true);
		notifyOnSubscriptionChanged.callsFake(() => expect(committed).to.be.true);

		await setRoomKeyIDMethod('uid', 'rid', 'kid', 'kid-encrypted-key');

		expect(models.Rooms.setE2eKeyId.callCount).to.equal(2);
		expect(notifyOnRoomChanged.calledOnceWithExactly({ _id: 'rid', e2eKeyId: 'kid' })).to.be.true;
		expect(notifyOnSubscriptionChanged.calledOnceWithExactly({ _id: 'sid', rid: 'rid', E2EKey: 'kid-encrypted-key' })).to.be.true;
		expect(notifyOnRoomChangedById.called).to.be.false;
	});

	it('reads both notification payloads from primary after commit instead of a stale secondary', async () => {
		let committed = false;
		session.withTransaction.callsFake(async (callback) => {
			const result = await callback(session);
			committed = true;
			return result;
		});
		const room = { _id: 'rid', e2eKeyId: 'kid' };
		const subscription = { _id: 'sid', E2EKey: 'kid-encrypted-key' };
		models.Rooms.findOneById.callsFake(async (_id, options) => {
			expect(committed).to.be.true;
			return options?.readPreference === 'primary' ? room : { _id: 'rid' };
		});
		models.Subscriptions.findOneById.callsFake(async (_id, options) => {
			expect(committed).to.be.true;
			return options?.readPreference === 'primary' ? subscription : { _id: 'sid' };
		});

		await setRoomKeyIDMethod('uid', 'rid', 'kid', 'kid-encrypted-key');

		expect(models.Rooms.findOneById.calledOnceWithExactly('rid', { readPreference: 'primary' })).to.be.true;
		expect(models.Subscriptions.findOneById.calledOnceWithExactly('sid', { readPreference: 'primary' })).to.be.true;
		expect(notifyOnRoomChanged.calledOnceWithExactly(room)).to.be.true;
		expect(notifyOnSubscriptionChanged.calledOnceWithExactly(subscription)).to.be.true;
		expect(notifyOnRoomChangedById.called).to.be.false;
	});

	it('notifies the room but not an unchanged subscription after commit', async () => {
		models.Subscriptions.setGroupE2EKey.resolves({ matchedCount: 1, modifiedCount: 0 });
		models.Rooms.removeUsersFromE2EEQueueByRoomId.resolves({ modifiedCount: 0 });

		await setRoomKeyIDMethod('uid', 'rid', 'kid', 'kid-encrypted-key');

		expect(notifyOnRoomChanged.calledOnce).to.be.true;
		expect(notifyOnSubscriptionChanged.called).to.be.false;
	});

	for (const key of [undefined, '']) {
		it(`preserves the non-transactional path for ${key === undefined ? 'an omitted' : 'an empty'} key`, async () => {
			await setRoomKeyIDMethod('uid', 'rid', 'kid', key);

			expect(models.Rooms.setE2eKeyId.calledOnceWithExactly('rid', 'kid')).to.be.true;
			expect(startSession.called).to.be.false;
			expect(models.Subscriptions.findOneByRoomIdAndUserId.called).to.be.false;
			expect(updateGroupKey.called).to.be.false;
			expect(notifyOnRoomChanged.calledOnceWithExactly({ _id: 'rid', e2eKeyId: 'kid' })).to.be.true;
		});
	}

	it('rejects an inaccessible room before starting a session', async () => {
		canAccessRoomIdAsync.resolves(false);

		await assert.rejects(setRoomKeyIDMethod('uid', 'rid', 'kid', 'encrypted-key'), { message: 'error-invalid-room' });

		expect(startSession.called).to.be.false;
		expect(models.Rooms.setE2eKeyId.called).to.be.false;
		expectNoNotifications();
	});

	it('rejects an absent creator subscription before writing the key ID', async () => {
		models.Subscriptions.findOneByRoomIdAndUserId.resolves(null);

		await assert.rejects(setRoomKeyIDMethod('uid', 'rid', 'kid', 'encrypted-key'), { message: 'error-invalid-subscription' });

		expect(models.Rooms.setE2eKeyId.called).to.be.false;
		expect(session.abortTransaction.calledOnce).to.be.true;
		expect(session.endSession.calledOnce).to.be.true;
		expectNoNotifications();
	});

	for (const key of [undefined, 'encrypted-key']) {
		it(`rejects an existing key ID ${key ? 'with' : 'without'} a creator key`, async () => {
			models.Rooms.setE2eKeyId.resolves(null);

			await assert.rejects(setRoomKeyIDMethod('uid', 'rid', 'kid', key), { message: 'error-room-e2e-key-already-exists' });

			expect(models.Subscriptions.setGroupE2EKey.called).to.be.false;
			expect(updateGroupKey.called).to.be.false;
			expectNoNotifications();
		});
	}

	it('rejects a subscription that disappears before its key write', async () => {
		models.Subscriptions.setGroupE2EKey.resolves({ matchedCount: 0, modifiedCount: 0 });

		await assert.rejects(setRoomKeyIDMethod('uid', 'rid', 'kid', 'encrypted-key'), { message: 'error-invalid-subscription' });

		expect(models.Rooms.removeUsersFromE2EEQueueByRoomId.called).to.be.false;
		expect(session.abortTransaction.calledOnce).to.be.true;
		expectNoNotifications();
	});

	for (const [name, write] of [
		['subscription read', models.Subscriptions.findOneByRoomIdAndUserId],
		['room key ID write', models.Rooms.setE2eKeyId],
		['subscription key write', models.Subscriptions.setGroupE2EKey],
		['queue writes', models.Rooms.removeUsersFromE2EEQueueByRoomId],
	] as const) {
		it(`preserves a failed ${name} and sends no notification`, async () => {
			const failure = new Error('database operation failed');
			write.rejects(failure);

			await assert.rejects(setRoomKeyIDMethod('uid', 'rid', 'kid', 'encrypted-key'), (error) => error === failure);

			expect(session.abortTransaction.calledOnce).to.be.true;
			expect(session.endSession.calledOnce).to.be.true;
			expectNoNotifications();
		});
	}

	it('preserves the original write error if both abort and session cleanup fail', async () => {
		const failure = new Error('subscription key write failed');
		models.Subscriptions.setGroupE2EKey.rejects(failure);
		session.abortTransaction.rejects(new Error('abort failed'));
		session.endSession.rejects(new Error('end failed'));

		await assert.rejects(setRoomKeyIDMethod('uid', 'rid', 'kid', 'encrypted-key'), (error) => error === failure);

		expect(session.endSession.calledOnce).to.be.true;
		expectNoNotifications();
	});

	it('does not notify if commit fails', async () => {
		const failure = new Error('commit failed');
		session.withTransaction.callsFake(async (callback) => {
			await callback(session);
			throw failure;
		});

		await assert.rejects(setRoomKeyIDMethod('uid', 'rid', 'kid', 'encrypted-key'), (error) => error === failure);

		expect(session.endSession.calledOnce).to.be.true;
		expectNoNotifications();
	});

	it('notifies committed changes even if session cleanup fails', async () => {
		session.endSession.rejects(new Error('end failed'));

		await setRoomKeyIDMethod('uid', 'rid', 'kid', 'encrypted-key');

		expect(notifyOnRoomChanged.calledOnce).to.be.true;
		expect(notifyOnSubscriptionChanged.calledOnce).to.be.true;
	});

	it('uses the driver retry loop without sending notifications from an aborted attempt', async (t) => {
		const driverClient = new MongoClient('mongodb://127.0.0.1:27017');
		const driverSession = driverClient.startSession();
		t.after(() => driverClient.close());
		startSession.returns(driverSession);
		const commit = sinon.spy(driverSession, 'commitTransaction');
		const abort = sinon.spy(driverSession, 'abortTransaction');
		const transientError = new MongoServerError({ message: 'retry write', errorLabels: ['TransientTransactionError'] });
		models.Subscriptions.setGroupE2EKey.onFirstCall().rejects(transientError);
		models.Subscriptions.setGroupE2EKey.onSecondCall().callsFake(async () => {
			expectNoNotifications();
			return { matchedCount: 1, modifiedCount: 1 };
		});
		notifyOnRoomChanged.callsFake(() => expect(commit.calledOnce).to.be.true);

		await setRoomKeyIDMethod('uid', 'rid', 'kid', 'encrypted-key');

		expect(abort.calledOnce).to.be.true;
		expect(models.Subscriptions.setGroupE2EKey.callCount).to.equal(2);
		expect(notifyOnRoomChanged.calledOnce).to.be.true;
		expect(notifyOnSubscriptionChanged.calledOnce).to.be.true;
	});

	it('does not replace a commit error with an earlier retried write error', async (t) => {
		const driverClient = new MongoClient('mongodb://127.0.0.1:27017');
		const driverSession = driverClient.startSession();
		t.after(() => driverClient.close());
		startSession.returns(driverSession);
		const commitFailure = new MongoServerError({ message: 'commit failed' });
		sinon.stub(driverSession, 'commitTransaction').rejects(commitFailure);
		models.Subscriptions.setGroupE2EKey
			.onFirstCall()
			.rejects(new MongoServerError({ message: 'retry write', errorLabels: ['TransientTransactionError'] }));

		await assert.rejects(setRoomKeyIDMethod('uid', 'rid', 'kid', 'encrypted-key'), (error) => error === commitFailure);

		expect(models.Subscriptions.setGroupE2EKey.callCount).to.equal(2);
		expectNoNotifications();
	});
});
