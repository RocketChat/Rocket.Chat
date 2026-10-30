import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { after, before, beforeEach, describe, it } from 'node:test';

import type { IRoom, ISubscription } from '@rocket.chat/core-typings';
import { MongoClient } from 'mongodb';
import proxyquire from 'proxyquire';
import sinon from 'sinon';

const mongoUrl = process.env.E2EE_TEST_MONGO_URL || process.env.MONGO_URL;

const { BaseRaw } = proxyquire.noCallThru().load('../../../../../packages/models/src/models/BaseRaw.ts', {
	'..': { getCollectionName: (name: string) => name, UpdaterImpl: class {} },
});
const { RoomsRaw } = proxyquire.noCallThru().load('../../../../../packages/models/src/models/Rooms.ts', {
	'../index': {},
	'./BaseRaw': { BaseRaw },
});
const { SubscriptionsRaw } = proxyquire.noCallThru().load('../../../../../packages/models/src/models/Subscriptions.ts', {
	'../index': {},
	'./BaseRaw': { BaseRaw },
});

describe('setRoomKeyIDMethod MongoDB atomicity', { skip: !mongoUrl }, () => {
	const client = new MongoClient(mongoUrl || 'mongodb://127.0.0.1:27017');
	const db = client.db(`e2ee_atomic_${randomUUID().replaceAll('-', '')}`);
	const rooms = new RoomsRaw(db);
	const subscriptions = new SubscriptionsRaw(db);
	const notifyOnRoomChanged = sinon.stub();
	const notifyOnSubscriptionChanged = sinon.stub();
	const { setRoomKeyIDMethod } = proxyquire.noCallThru().load('./setRoomKeyID.ts', {
		'@rocket.chat/core-services': {
			ClientSafeError: class extends Error {
				constructor(public error: string) {
					super(error);
				}
			},
		},
		'@rocket.chat/models': { Rooms: rooms, Subscriptions: subscriptions },
		'../../database/utils': { client },
		'../../lib/authorization/canAccessRoom': { canAccessRoomIdAsync: async () => true },
		'../../lib/notifyListener': {
			notifyOnRoomChanged,
			notifyOnSubscriptionChanged,
		},
	});

	before(async () => {
		await client.connect();
		await Promise.all([rooms.createIndexes(), subscriptions.createIndexes()]);
	});

	after(async () => {
		try {
			await db.dropDatabase();
		} finally {
			await client.close();
		}
	});

	beforeEach(async () => {
		sinon.restore();
		notifyOnRoomChanged.reset();
		notifyOnSubscriptionChanged.reset();
		await rooms.removeById('rid');
		await subscriptions.removeById('sid');
		await rooms.insertOne({ _id: 'rid', t: 'p', encrypted: true, usersWaitingForE2EKeys: [{ userId: 'uid', ts: new Date() }] } as IRoom);
		await subscriptions.insertOne({ _id: 'sid', rid: 'rid', u: { _id: 'uid' }, t: 'p', name: 'room' } as ISubscription);
	});

	const assertOriginalState = async () => {
		const room = await rooms.findOneById('rid');
		const subscription = await subscriptions.findOneById('sid');
		assert.equal(room.e2eKeyId, undefined);
		assert.equal(subscription.E2EKey, undefined);
		assert.deepEqual(
			room.usersWaitingForE2EKeys.map(({ userId }: { userId: string }) => userId),
			['uid'],
		);
		assert.equal(notifyOnRoomChanged.called, false);
		assert.equal(notifyOnSubscriptionChanged.called, false);
	};

	for (const write of ['room key ID', 'subscription key', 'queue pull', 'queue cleanup']) {
		it(`leaves no partial key state after the ${write} write fails`, async () => {
			const failure = new Error(`${write} failed`);
			if (write === 'room key ID') {
				const original = rooms.setE2eKeyId.bind(rooms);
				sinon.stub(rooms, 'setE2eKeyId').callsFake(async (...args: unknown[]) => {
					await original(...args);
					throw failure;
				});
			} else if (write === 'subscription key') {
				const original = subscriptions.setGroupE2EKey.bind(subscriptions);
				sinon.stub(subscriptions, 'setGroupE2EKey').callsFake(async (...args: unknown[]) => {
					await original(...args);
					throw failure;
				});
			} else {
				const original = rooms.updateMany.bind(rooms);
				let calls = 0;
				sinon.stub(rooms, 'updateMany').callsFake(async (...args: unknown[]) => {
					const result = await original(...args);
					if (++calls === (write === 'queue pull' ? 1 : 2)) {
						throw failure;
					}
					return result;
				});
			}

			await assert.rejects(setRoomKeyIDMethod('uid', 'rid', 'kid', 'encrypted-key'), (error) => error === failure);

			await assertOriginalState();
		});
	}

	it('rejects an absent creator subscription without leaving a key ID', async () => {
		await subscriptions.removeById('sid');

		await assert.rejects(setRoomKeyIDMethod('uid', 'rid', 'kid', 'encrypted-key'), { message: 'error-invalid-subscription' });

		assert.equal((await rooms.findOneById('rid')).e2eKeyId, undefined);
		assert.equal(notifyOnRoomChanged.called, false);
	});

	it('makes both keys and queue changes visible before notifying', async () => {
		const checks: Promise<void>[] = [];
		const checkCommittedState = async () => {
			assert.equal((await rooms.findOneById('rid')).e2eKeyId, 'kid');
			assert.equal((await subscriptions.findOneById('sid')).E2EKey, 'encrypted-key');
			assert.equal((await rooms.findOneById('rid')).usersWaitingForE2EKeys, undefined);
		};
		notifyOnRoomChanged.callsFake((room) => {
			assert.equal(room.e2eKeyId, 'kid');
			assert.equal(room.usersWaitingForE2EKeys, undefined);
			checks.push(checkCommittedState());
		});
		notifyOnSubscriptionChanged.callsFake((subscription) => {
			assert.equal(subscription.E2EKey, 'encrypted-key');
			checks.push(checkCommittedState());
		});

		await setRoomKeyIDMethod('uid', 'rid', 'kid', 'encrypted-key');
		await Promise.all(checks);

		assert.equal(notifyOnRoomChanged.calledOnce, true);
		assert.equal(notifyOnSubscriptionChanged.calledOnce, true);
	});
});
