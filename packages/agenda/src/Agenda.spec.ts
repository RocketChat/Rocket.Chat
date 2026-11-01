import { MongoClient } from 'mongodb';
import type { Db } from 'mongodb';
import { MongoMemoryServer } from 'mongodb-memory-server';

import { Agenda } from './Agenda';

const COLLECTION = 'agenda_spec_jobs';

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

describe('Agenda with an invalid repeat interval', () => {
	let mongo: MongoMemoryServer;
	let client: MongoClient;
	let db: Db;
	let agenda: Agenda;
	const runs: Record<string, number> = {};

	beforeAll(async () => {
		mongo = await MongoMemoryServer.create();
		client = await MongoClient.connect(mongo.getUri());
		db = client.db('agenda_spec');
	});

	afterAll(async () => {
		await client.close();
		await mongo.stop();
	});

	beforeEach(async () => {
		await db.collection(COLLECTION).deleteMany({});

		agenda = new Agenda({ mongo: db, db: { collection: COLLECTION }, defaultConcurrency: 1, processEvery: '1 minute' });
		for (const name of ['invalid-cron', 'zero-step', 'human-interval', 'stored-invalid']) {
			runs[name] = 0;
			agenda.define(name, async () => {
				runs[name]++;
			});
		}
		await agenda.start();
	});

	afterEach(async () => {
		await agenda.stop();
	});

	it.each([
		['invalid-cron', '0 0 1 12 *'],
		['zero-step', '*/0 * * * *'],
	])('should not run %s (%s) and should record the failure', async (name, interval) => {
		await agenda.every(interval, name, {}, {});
		await wait(1000);

		expect(runs[name]).toBe(0);
		const job = await db.collection(COLLECTION).findOne({ name });
		expect(job?.nextRunAt).toBeNull();
		expect(job?.failReason).toBe('failed to calculate nextRunAt due to invalid repeat interval');
	});

	it('should still run a job with a valid human interval once, then wait for the interval', async () => {
		await agenda.every('5 minutes', 'human-interval', {}, {});
		await wait(1000);

		expect(runs['human-interval']).toBe(1);
		const job = await db.collection(COLLECTION).findOne({ name: 'human-interval' });
		expect(job?.nextRunAt.getTime()).toBe(job?.lastRunAt.getTime() + 5 * 60 * 1000);
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
		await wait(1000);

		expect(runs['stored-invalid']).toBe(1);
		const job = await db.collection(COLLECTION).findOne({ name: 'stored-invalid' });
		expect(job?.nextRunAt).toBeNull();
		expect(job?.failReason).toBe('failed to calculate nextRunAt due to invalid repeat interval');
	});
});
