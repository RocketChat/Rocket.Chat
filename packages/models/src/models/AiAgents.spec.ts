import { createHash } from 'node:crypto';

import type { IAiAgent } from '@rocket.chat/core-typings';
import type { IAiAgentRevisionsModel } from '@rocket.chat/model-typings';
import type { Db } from 'mongodb';
import { Binary, MongoClient } from 'mongodb';
import { MongoMemoryServer } from 'mongodb-memory-server';

import { AiAgentRevisionsRaw } from './AiAgentRevisions';
import { AiAgentsRaw } from './AiAgents';
import { AiEnginesRaw } from './AiEngines';

const DAY_MS = 24 * 60 * 60 * 1000;

let mongo: MongoMemoryServer;
let client: MongoClient;
let db: Db;
let agents: AiAgentsRaw;
let revisions: AiAgentRevisionsRaw;
let engines: AiEnginesRaw;

const newAgent = (seatId: string): Omit<IAiAgent, '_id' | '_updatedAt'> => ({
	engineId: 'engine-1',
	seatId,
	claim: `claim-${seatId}`,
	lastVersion: 0,
	createdBy: 'admin-1',
	createdAt: new Date(),
});

beforeAll(async () => {
	mongo = await MongoMemoryServer.create();
	client = await MongoClient.connect(mongo.getUri());
	db = client.db('ai_agents_models_test');
	agents = new AiAgentsRaw(db);
	revisions = new AiAgentRevisionsRaw(db);
	engines = new AiEnginesRaw(db);
	await Promise.all([agents.createIndexes(), revisions.createIndexes(), engines.createIndexes()]);
});

afterAll(async () => {
	await client.close();
	await mongo.stop();
});

beforeEach(async () => {
	await Promise.all([agents.col.deleteMany({}), revisions.col.deleteMany({}), engines.col.deleteMany({})]);
});

describe('AiAgentsRaw.allocateVersionById', () => {
	it('gives every concurrent writer a different version, none below the clock', async () => {
		const { insertedId } = await agents.insertOne(newAgent('seat-01'));
		const before = Date.now();

		const versions = await Promise.all(Array.from({ length: 25 }, () => agents.allocateVersionById(insertedId, DAY_MS)));

		expect(new Set(versions).size).toBe(25);
		for (const version of versions) {
			expect(version).not.toBeNull();
			expect(version).toBeGreaterThanOrEqual(before - 1000);
		}
		const agent = await agents.findOneById(insertedId);
		expect(agent?.lastVersion).toBe(Math.max(...(versions as number[])));
	});

	it('numbers above every earlier version once the clock has passed them, after the agent document is restored to an older last version', async () => {
		const { insertedId } = await agents.insertOne(newAgent('seat-01'));
		const served = [await agents.allocateVersionById(insertedId, DAY_MS), await agents.allocateVersionById(insertedId, DAY_MS)];
		const highest = Math.max(...(served as number[]));

		// what a restore from an older backup leaves behind
		await agents.col.updateOne({ _id: insertedId }, { $set: { lastVersion: 1 } });
		// Within the same millisecond the clock still equals a version already served: after a restore the clock orders
		// versions only once it has moved past them, which is all the design relies on it for.
		while (Date.now() <= highest) {
			await new Promise((resolve) => setTimeout(resolve, 1));
		}

		const next = await agents.allocateVersionById(insertedId, DAY_MS);
		expect(next).toBeGreaterThan(highest);
	});

	it('takes the last version plus one when the last version is ahead of the clock but within the allowance', async () => {
		const { insertedId } = await agents.insertOne(newAgent('seat-01'));
		const ahead = Date.now() + 60 * 60 * 1000;
		await agents.col.updateOne({ _id: insertedId }, { $set: { lastVersion: ahead } });

		await expect(agents.allocateVersionById(insertedId, DAY_MS)).resolves.toBe(ahead + 1);
	});

	it('allocates nothing when the last version is further ahead of the clock than the allowance', async () => {
		const { insertedId } = await agents.insertOne(newAgent('seat-01'));
		const farAhead = Date.now() + 2 * DAY_MS;
		await agents.col.updateOne({ _id: insertedId }, { $set: { lastVersion: farAhead } });

		await expect(agents.allocateVersionById(insertedId, DAY_MS)).resolves.toBeNull();
		await expect(agents.findOneById(insertedId)).resolves.toMatchObject({ lastVersion: farAhead });
	});

	it('allocates nothing for an agent that does not exist', async () => {
		await expect(agents.allocateVersionById('missing', DAY_MS)).resolves.toBeNull();
	});
});

describe('AiAgentsRaw.setHeadVersionById', () => {
	it('lets only one of two writers expecting the same head move it', async () => {
		const { insertedId } = await agents.insertOne(newAgent('seat-01'));
		await agents.setHeadVersionById(insertedId, undefined, { version: 10, status: 'published' });

		const results = await Promise.all([
			agents.setHeadVersionById(insertedId, 10, { version: 11, status: 'published' }),
			agents.setHeadVersionById(insertedId, 10, { version: 12, status: 'disabled' }),
		]);

		expect(results.map((result) => result.modifiedCount).sort()).toEqual([0, 1]);
		const agent = await agents.findOneById(insertedId);
		expect([11, 12]).toContain(agent?.headVersion);
	});

	it('refuses a first head when the agent already has one', async () => {
		const { insertedId } = await agents.insertOne(newAgent('seat-01'));
		await agents.setHeadVersionById(insertedId, undefined, { version: 10, status: 'published' });

		const result = await agents.setHeadVersionById(insertedId, undefined, { version: 11, status: 'published' });

		expect(result.modifiedCount).toBe(0);
		await expect(agents.findOneById(insertedId)).resolves.toMatchObject({ headVersion: 10, status: 'published' });
	});
});

describe('IAiAgent', () => {
	it('carries no bot id, so the seat registry stays the only source of a seat bot (checked by the type checker)', () => {
		type CarriesBot = 'botUserId' extends keyof IAiAgent ? true : false;
		const carriesBot: CarriesBot = false;

		expect(carriesBot).toBe(false);
	});
});

describe('AiAgentsRaw seats', () => {
	it('lets only one agent hold a seat', async () => {
		const results = await Promise.allSettled([agents.insertOne(newAgent('seat-01')), agents.insertOne(newAgent('seat-01'))]);

		expect(results.filter((result) => result.status === 'fulfilled')).toHaveLength(1);
		await expect(agents.findOneBySeatId('seat-01')).resolves.toMatchObject({ seatId: 'seat-01' });
	});
});

describe('AiAgentRevisionsRaw', () => {
	const record = Buffer.from('{"id":"seat-01","version":1,"name":"Döcs hélper ✓"}', 'utf8');
	const digest = createHash('sha256').update(record).digest('hex');

	const newRevision = (version: number) => ({
		agentId: 'agent-1',
		version,
		bytes: new Binary(record),
		digest,
		status: 'published' as const,
		actor: 'admin-1',
		action: 'create' as const,
		ts: new Date(),
	});

	it('returns the exact bytes that were written, matching their digest', async () => {
		await revisions.insertOne(newRevision(1));

		const revision = await revisions.findOneByAgentIdAndVersion('agent-1', 1);
		if (!revision) {
			throw new Error('revision not found');
		}

		expect(Buffer.from(revision.bytes.buffer).equals(record)).toBe(true);
		expect(createHash('sha256').update(revision.bytes.buffer).digest('hex')).toBe(revision.digest);
	});

	it('refuses a second revision with the same version', async () => {
		await revisions.insertOne(newRevision(1));

		await expect(revisions.insertOne(newRevision(1))).rejects.toThrow(/duplicate key/);
	});

	it('offers no way to change a revision (checked by the type checker)', () => {
		type Writes = 'updateOne' | 'updateMany' | 'update' | 'findOneAndUpdate' | 'updateFromUpdater';
		type OffersNone<K extends string> = [Extract<K, keyof IAiAgentRevisionsModel>] extends [never] ? true : false;
		const offersNoWrite: OffersNone<Writes> = true;
		const offersNoRead: OffersNone<'findOneByAgentIdAndVersion'> = false;

		expect([offersNoWrite, offersNoRead]).toEqual([true, false]);
	});
});

describe('AiEnginesRaw credentials', () => {
	const now = new Date('2026-11-20T00:00:00Z');
	const credential = (id: string, expiresAt = new Date(now.getTime() + DAY_MS)) => ({
		id,
		verifier: createHash('sha256').update(id).digest('hex'),
		createdAt: now,
		expiresAt,
	});

	it('finds an engine by any of its credential ids', async () => {
		await engines.insertOne({ _id: 'engine-1', name: 'one', credentials: [credential('cred-a')], createdBy: 'admin-1', createdAt: now });

		await expect(engines.findOneByCredentialId('cred-a')).resolves.toMatchObject({ _id: 'engine-1' });
		await expect(engines.findOneByCredentialId('cred-b')).resolves.toBeNull();
	});

	it('refuses a credential id that another engine already uses', async () => {
		await engines.insertOne({ _id: 'engine-1', name: 'one', credentials: [credential('cred-a')], createdBy: 'admin-1', createdAt: now });

		await expect(
			engines.insertOne({ _id: 'engine-2', name: 'two', credentials: [credential('cred-a')], createdBy: 'admin-1', createdAt: now }),
		).rejects.toThrow(/duplicate key/);
	});

	it('adds a credential only while fewer than the limit are active', async () => {
		await engines.insertOne({ _id: 'engine-1', name: 'one', credentials: [credential('cred-a')], createdBy: 'admin-1', createdAt: now });

		const second = await engines.addCredentialWhileFewerActive('engine-1', credential('cred-b'), { maxActive: 2, now });
		const third = await engines.addCredentialWhileFewerActive('engine-1', credential('cred-c'), { maxActive: 2, now });

		expect(second.modifiedCount).toBe(1);
		expect(third.modifiedCount).toBe(0);
	});

	it('does not count revoked or expired credentials against the limit', async () => {
		await engines.insertOne({
			_id: 'engine-1',
			name: 'one',
			credentials: [credential('cred-a'), credential('cred-old', new Date(now.getTime() - 1))],
			createdBy: 'admin-1',
			createdAt: now,
		});
		await engines.revokeCredentialById('engine-1', 'cred-a', now);

		const added = await engines.addCredentialWhileFewerActive('engine-1', credential('cred-b'), { maxActive: 1, now });

		expect(added.modifiedCount).toBe(1);
	});

	it('revokes a credential once and keeps the first revocation time', async () => {
		await engines.insertOne({ _id: 'engine-1', name: 'one', credentials: [credential('cred-a')], createdBy: 'admin-1', createdAt: now });

		const first = await engines.revokeCredentialById('engine-1', 'cred-a', now);
		const again = await engines.revokeCredentialById('engine-1', 'cred-a', new Date(now.getTime() + 1000));

		expect(first.modifiedCount).toBe(1);
		expect(again.modifiedCount).toBe(0);
		const engine = await engines.findOneByCredentialId('cred-a');
		expect(engine?.credentials[0].revokedAt).toEqual(now);
	});

	it('stores observed engine reports and lastReportAt', async () => {
		await engines.insertOne({ _id: 'engine-1', name: 'one', credentials: [credential('cred-a')], createdBy: 'admin-1', createdAt: now });
		const reportedAt = new Date('2026-11-25T00:00:00Z');

		const res = await engines.updateObservedReport(
			'engine-1',
			{
				contractVersion: '1.1.0',
				workspaceId: 'ws-1',
				reportedAt,
				catalogue: {
					tools: ['docs_search'],
					skillsCommit: '438544159fd6359527759d2a97dd227ae9f6c58c',
					skills: ['public-docs'],
					modelRoutes: ['openrouter:openai/gpt-4o-mini'],
				},
				seats: [],
			},
			reportedAt,
		);

		expect(res.modifiedCount).toBe(1);
		const stored = await engines.findOneById('engine-1');
		expect(stored?.lastReportAt).toEqual(reportedAt);
		expect(stored?.observed?.catalogue.tools).toEqual(['docs_search']);
	});

	it('deletes only uncommitted agents via deleteOneUncommittedById', async () => {
		await agents.insertOne({
			_id: 'agent-uncommitted',
			engineId: 'engine-1',
			seatId: 'seat-u',
			claim: '11111111-2222-4333-8444-555555555555',
			lastVersion: 0,
			createdBy: 'admin-1',
			createdAt: now,
		});
		await agents.insertOne({
			_id: 'agent-committed',
			engineId: 'engine-1',
			seatId: 'seat-c',
			claim: '11111111-2222-4333-8444-555555555556',
			lastVersion: 1,
			headVersion: 1,
			status: 'published',
			createdBy: 'admin-1',
			createdAt: now,
		});

		const delUncommitted = await agents.deleteOneUncommittedById('agent-uncommitted');
		const delCommitted = await agents.deleteOneUncommittedById('agent-committed');

		expect(delUncommitted.deletedCount).toBe(1);
		expect(delCommitted.deletedCount).toBe(0);
		await expect(agents.findOneById('agent-committed')).resolves.not.toBeNull();
	});
});
