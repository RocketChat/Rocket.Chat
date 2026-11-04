import { LivechatInquiryStatus } from '@rocket.chat/core-typings';
import type { Db } from 'mongodb';
import { MongoClient } from 'mongodb';
import { MongoMemoryServer } from 'mongodb-memory-server';

import { LivechatInquiryRaw } from './LivechatInquiry';

// `LivechatInquiry` imports `..`, whose barrel pulls in every model and cycles back here.
jest.mock('..', () => ({
	getCollectionName: (name: string) => name,
	UpdaterImpl: jest.requireActual('../updater').UpdaterImpl,
}));

const LOCK_TIMEOUT_MS = parseInt(process.env.INQUIRY_LOCK_TIMEOUT ?? '10000');
const SORT = { ts: 1 } as const;

describe('LivechatInquiryRaw queue lock', () => {
	let mongo: MongoMemoryServer;
	let client: MongoClient;
	let db: Db;
	let model: LivechatInquiryRaw;
	let now: number;

	const advance = (ms: number) => {
		now += ms;
		jest.setSystemTime(now);
	};

	const insertQueuedInquiry = async () => {
		const _id = 'inquiry';
		await db.collection('livechat_inquiry').insertOne({ _id, rid: 'room', status: LivechatInquiryStatus.QUEUED, ts: new Date() } as any);
		return _id;
	};

	const findStored = (_id: string) => db.collection('livechat_inquiry').findOne({ _id } as any);

	const acquire = async () => {
		const locked = await model.findNextAndLock(SORT, null);
		if (!locked) {
			throw new Error('expected an inquiry to be locked');
		}
		return locked;
	};

	beforeAll(async () => {
		mongo = await MongoMemoryServer.create();
		client = await MongoClient.connect(mongo.getUri());
		db = client.db('livechat_inquiry_spec');
		model = new LivechatInquiryRaw(db);
		await model.createIndexes();
	});

	afterAll(async () => {
		await client.close();
		await mongo.stop();
	});

	beforeEach(async () => {
		// Only `Date` is faked: the driver keeps its real timers.
		jest.useFakeTimers({
			doNotFake: [
				'hrtime',
				'nextTick',
				'performance',
				'queueMicrotask',
				'requestAnimationFrame',
				'cancelAnimationFrame',
				'requestIdleCallback',
				'cancelIdleCallback',
				'setImmediate',
				'clearImmediate',
				'setInterval',
				'clearInterval',
				'setTimeout',
				'clearTimeout',
			],
		});
		now = Date.parse('2026-01-01T00:00:00.000Z');
		jest.setSystemTime(now);
		await db.collection('livechat_inquiry').deleteMany({});
	});

	afterEach(() => {
		jest.useRealTimers();
	});

	it('returns the lock it acquired on a fresh inquiry', async () => {
		const _id = await insertQueuedInquiry();

		const locked = await acquire();

		expect(locked.lockedAt).toEqual((await findStored(_id))?.lockedAt);
		expect((await model.takeInquiry(_id, locked.lockedAt)).modifiedCount).toBe(1);
	});

	it('does not hand out an inquiry whose lock has not expired', async () => {
		await insertQueuedInquiry();

		await acquire();
		advance(LOCK_TIMEOUT_MS - 1);

		expect(await model.findNextAndLock(SORT, null)).toBeNull();
	});

	it('lets two workers acquire the same inquiry only once', async () => {
		await insertQueuedInquiry();

		const results = await Promise.all([model.findNextAndLock(SORT, null), model.findNextAndLock(SORT, null)]);

		expect(results.filter(Boolean)).toHaveLength(1);
	});

	it('takes an inquiry whose previous lock expired without being released', async () => {
		const _id = await insertQueuedInquiry();
		await acquire();
		advance(LOCK_TIMEOUT_MS);

		const locked = await acquire();

		expect(locked.lockedAt).toEqual((await findStored(_id))?.lockedAt);
		expect((await model.takeInquiry(_id, locked.lockedAt)).modifiedCount).toBe(1);
	});

	it('takes an inquiry after several cycles that failed without releasing the lock', async () => {
		const _id = await insertQueuedInquiry();
		for (let cycle = 0; cycle < 3; cycle++) {
			await acquire();
			advance(LOCK_TIMEOUT_MS);
		}

		const locked = await acquire();

		expect((await model.takeInquiry(_id, locked.lockedAt)).modifiedCount).toBe(1);
	});

	it('lets only the current lock holder take the inquiry once an earlier lock expired', async () => {
		const _id = await insertQueuedInquiry();
		const expired = await acquire();
		advance(LOCK_TIMEOUT_MS);
		const current = await acquire();

		expect((await model.takeInquiry(_id, expired.lockedAt)).modifiedCount).toBe(0);
		expect((await model.takeInquiry(_id, current.lockedAt)).modifiedCount).toBe(1);
	});

	it('releases the lock for its holder, so an inquiry nobody could serve is offered again', async () => {
		const _id = await insertQueuedInquiry();
		const locked = await acquire();

		expect((await model.unlock(_id, locked.lockedAt)).modifiedCount).toBe(1);
		await acquire();
	});

	it('does not let a worker whose lock expired release the current holder lock', async () => {
		const _id = await insertQueuedInquiry();
		const expired = await acquire();
		advance(LOCK_TIMEOUT_MS);
		const current = await acquire();

		expect((await model.unlock(_id, expired.lockedAt)).modifiedCount).toBe(0);
		expect((await findStored(_id))?.lockedAt).toEqual(current.lockedAt);
		expect(await model.findNextAndLock(SORT, null)).toBeNull();
	});

	it('takes an inquiry that was re-queued while still holding the lock of a failed assignment', async () => {
		const _id = await insertQueuedInquiry();
		const first = await acquire();
		expect((await model.takeInquiry(_id, first.lockedAt)).modifiedCount).toBe(1);
		await model.queueInquiry(_id);
		advance(LOCK_TIMEOUT_MS);

		const locked = await acquire();

		expect((await model.takeInquiry(_id, locked.lockedAt)).modifiedCount).toBe(1);
	});
});
