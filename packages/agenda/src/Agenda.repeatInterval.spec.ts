import { MongoClient } from 'mongodb';
import type { Db } from 'mongodb';
import { MongoMemoryServer } from 'mongodb-memory-server';

import { Agenda } from './Agenda';

const COLLECTION = 'agenda_spec_jobs';
const INVALID_INTERVAL = 'failed to calculate nextRunAt due to invalid repeat interval';
const JOB_NAMES = ['invalid-cron', 'zero-step', 'sub-millisecond', 'human-interval', 'stored-invalid', 're-registered', 'control'];

jest.setTimeout(20000);

const waitFor = async (condition: () => boolean | Promise<boolean>, description: string, timeout = 5000) => {
	const deadline = Date.now() + timeout;
	while (!(await condition())) {
		if (Date.now() > deadline) {
			throw new Error(`Timed out after ${timeout}ms waiting for ${description}`);
		}
		await new Promise((resolve) => setTimeout(resolve, 20));
	}
};

describe('Agenda with an invalid repeat interval', () => {
	let mongo: MongoMemoryServer;
	let client: MongoClient;
	let db: Db;
	let agenda: Agenda;
	const runs: Record<string, number> = {};

	const findJob = (name: string) => db.collection(COLLECTION).findOne({ name });

	// a job queued after the one under test, so once it has finished the scheduler has had its chance to run the other one
	const runControlJob = async () => {
		const before = runs.control;
		await agenda.now('control', {});
		await waitFor(async () => runs.control > before && (await findJob('control'))?.lockedAt === null, 'the control job to finish');
	};

	beforeAll(async () => {
		mongo = await MongoMemoryServer.create();
		client = await MongoClient.connect(mongo.getUri());
		db = client.db('agenda_spec');
	}, 60000);

	afterAll(async () => {
		await client.close();
		await mongo.stop();
	});

	beforeEach(async () => {
		await db.collection(COLLECTION).deleteMany({});

		agenda = new Agenda({ mongo: db, db: { collection: COLLECTION }, defaultConcurrency: 1, processEvery: '1 minute' });
		for (const name of JOB_NAMES) {
			runs[name] = 0;
			agenda.define(name, async () => {
				runs[name]++;
			});
		}
		await agenda.start();
	});

	afterEach(async () => {
		jest.restoreAllMocks();
		await agenda.stop();
	});

	it.each([
		['invalid-cron', '0 0 1 12 *'],
		['zero-step', '*/0 * * * *'],
		['sub-millisecond', 0.5],
	])('should record %s (%p) as failed and never run it', async (name, interval) => {
		await agenda.every(interval, name, {}, {});
		await runControlJob();

		expect(runs[name]).toBe(0);
		const job = await findJob(name);
		expect(job?.nextRunAt).toBeNull();
		expect(job?.failReason).toBe(INVALID_INTERVAL);
	});

	it('should run a job with a valid human interval once, then wait for the interval', async () => {
		await agenda.every('5 minutes', 'human-interval', {}, {});
		await waitFor(async () => (await findJob('human-interval'))?.lastFinishedAt instanceof Date, 'the first run to finish');
		await runControlJob();

		expect(runs['human-interval']).toBe(1);
		const job = await findJob('human-interval');
		expect(job?.nextRunAt.getTime()).toBe(job?.lastRunAt.getTime() + 5 * 60 * 1000);
		expect(job?.failReason).toBeUndefined();

		await agenda.every('5 minutes', 'human-interval', {}, {});
		await runControlJob();

		expect(runs['human-interval']).toBe(1);
		expect((await findJob('human-interval'))?.nextRunAt).toEqual(job?.nextRunAt);
	});

	it('should run a failed job right away once it is registered again with a valid interval', async () => {
		await agenda.every('0 0 1 12 *', 're-registered', {}, {});
		await runControlJob();

		expect(runs['re-registered']).toBe(0);
		expect((await findJob('re-registered'))?.nextRunAt).toBeNull();

		await agenda.every('5 minutes', 're-registered', {}, {});
		await waitFor(
			async () => runs['re-registered'] === 1 && (await findJob('re-registered'))?.lastFinishedAt instanceof Date,
			'the re-registered job to run',
		);
		await runControlJob();

		expect(runs['re-registered']).toBe(1);
		expect(await db.collection(COLLECTION).countDocuments({ name: 're-registered' })).toBe(1);
		const job = await findJob('re-registered');
		expect(job?.repeatInterval).toBe('5 minutes');
		expect(job?.nextRunAt.getTime()).toBe(job?.lastRunAt.getTime() + 5 * 60 * 1000);
	});

	it('should never make a failed job due again while it still has its invalid interval', async () => {
		await agenda.every('0 0 1 12 *', 're-registered', {}, {});
		await runControlJob();

		// what another scheduler polling the collection could claim between the writes of the re-registration
		const collection = agenda['getCollection']();
		const findOneAndUpdate = collection.findOneAndUpdate.bind(collection);
		const beforeUpsert: { nextRunAt?: Date | null; repeatInterval?: string } = {};
		jest.spyOn(collection, 'findOneAndUpdate').mockImplementationOnce(async (...args: Parameters<typeof collection.findOneAndUpdate>) => {
			const stored = await findJob('re-registered');
			beforeUpsert.nextRunAt = stored?.nextRunAt;
			beforeUpsert.repeatInterval = stored?.repeatInterval;
			return findOneAndUpdate(...args);
		});

		await agenda.every('5 minutes', 're-registered', {}, {});

		expect(beforeUpsert.repeatInterval).toBeDefined();
		expect(beforeUpsert).not.toMatchObject({ nextRunAt: expect.any(Date), repeatInterval: '0 0 1 12 *' });
	});

	it('should stop re-running a job already stored as due with an invalid interval', async () => {
		const now = new Date();
		await db.collection(COLLECTION).insertOne({
			name: 'stored-invalid',
			type: 'single',
			repeatInterval: '0 0 1 12 *',
			nextRunAt: now,
			lastRunAt: now,
			lockedAt: null,
			priority: 0,
			data: {},
		});
		agenda.processJobs();
		await waitFor(async () => (await findJob('stored-invalid'))?.failReason === INVALID_INTERVAL, 'the stored job to be marked as failed');
		await waitFor(async () => (await findJob('stored-invalid'))?.lockedAt === null, 'the stored job to be unlocked');
		await runControlJob();

		expect(runs['stored-invalid']).toBe(1);
		expect((await findJob('stored-invalid'))?.nextRunAt).toBeNull();
	});
});
