import type { IUser } from '@rocket.chat/core-typings';
import type { Db, UpdateFilter } from 'mongodb';
import { MongoClient } from 'mongodb';
import { MongoMemoryServer } from 'mongodb-memory-server';

import { UsersRaw } from './Users';

let mongo: MongoMemoryServer;
let client: MongoClient;
let db: Db;
let users: UsersRaw;

beforeAll(async () => {
	mongo = await MongoMemoryServer.create();
	client = await MongoClient.connect(mongo.getUri());
	db = client.db('reserved_agent_bot_test');
	users = new UsersRaw(db);
	await users.createIndexes();
});

afterAll(async () => {
	await client.close();
	await mongo.stop();
});

describe('UsersRaw.insertReservedAgentBot', () => {
	it('stores an inactive bot that cannot log in, has no email or rooms, and belongs to the engine', async () => {
		const createdAt = new Date('2026-11-20T00:00:00Z');

		const { insertedId } = await users.insertReservedAgentBot({
			username: 'ai-agent-test000001',
			name: 'ai-agent-test000001',
			engineId: 'engine-1',
			createdAt,
		});

		const stored = await users.col.findOne({ _id: insertedId });
		expect(stored).toMatchObject({
			username: 'ai-agent-test000001',
			type: 'bot',
			roles: ['bot'],
			active: false,
			createdAt,
			aiAgents: { engineId: 'engine-1' },
		});
		expect(stored).not.toHaveProperty('services');
		expect(stored).not.toHaveProperty('emails');
		expect(stored).not.toHaveProperty('__rooms');
		expect(stored).not.toHaveProperty('customFields');
		expect(stored?._updatedAt).toBeInstanceOf(Date);
	});
});

describe('UsersRaw.activateReservedAgentBot', () => {
	const insertBot = async (username: string) => {
		const bot = { username, name: username, engineId: 'engine-1', createdAt: new Date() };
		const { insertedId } = await users.insertReservedAgentBot(bot);
		return insertedId;
	};

	it('names and activates a reserved bot of the engine and stamps activatedAt', async () => {
		const botId = await insertBot('ai-agent-activate-ok');

		const result = await users.activateReservedAgentBot(botId, 'engine-1', 'Docs helper');

		expect(result.matchedCount).toBe(1);
		const stored = await users.col.findOne({ _id: botId });
		expect(stored).toMatchObject({
			name: 'Docs helper',
			active: true,
			username: 'ai-agent-activate-ok',
			aiAgents: { engineId: 'engine-1' },
		});
		expect(stored?.aiAgents?.activatedAt).toBeInstanceOf(Date);

		// Re-running while still active succeeds and preserves activatedAt.
		const retryActive = await users.activateReservedAgentBot(botId, 'engine-1', 'Docs helper v2');
		expect(retryActive.matchedCount).toBe(1);
		const afterRetry = await users.col.findOne({ _id: botId });
		expect(afterRetry?.name).toBe('Docs helper v2');
		expect(afterRetry?.aiAgents?.activatedAt).toEqual(stored?.aiAgents?.activatedAt);
	});

	it('refuses to re-activate a bot that was deactivated after activation (with or without inactiveReason)', async () => {
		const botId = await insertBot('ai-agent-deactivated-after');
		await users.activateReservedAgentBot(botId, 'engine-1', 'Docs helper');

		// Simulate raw active: false deactivation
		await users.col.updateOne({ _id: botId }, { $set: { active: false } });
		const retryRaw = await users.activateReservedAgentBot(botId, 'engine-1', 'Docs helper retry');
		expect(retryRaw.matchedCount).toBe(0);
		await expect(users.col.findOne({ _id: botId })).resolves.toMatchObject({ active: false });

		// Simulate Rocket.Chat deactivate user path (active: false + inactiveReason: 'deactivated')
		await users.col.updateOne({ _id: botId }, { $set: { active: false, inactiveReason: 'deactivated' } });
		const retryWithReason = await users.activateReservedAgentBot(botId, 'engine-1', 'Docs helper retry');
		expect(retryWithReason.matchedCount).toBe(0);
		await expect(users.col.findOne({ _id: botId })).resolves.toMatchObject({ active: false, inactiveReason: 'deactivated' });
	});

	it.each([
		['another engine reserved it', {}, 'engine-2'],
		['it lost the marker', { $unset: { aiAgents: 1 } }, 'engine-1'],
		['it is no longer a bot', { $set: { type: 'user' } }, 'engine-1'],
		['it was given another role as well', { $set: { roles: ['bot', 'admin'] } }, 'engine-1'],
		['its role was replaced', { $set: { roles: ['user'] } }, 'engine-1'],
		['it was given a password', { $set: { 'services.password.bcrypt': 'synthetic-hash' } }, 'engine-1'],
		['it holds a login or personal access token', { $set: { 'services.resume.loginTokens': [{ hashedToken: 'synthetic' }] } }, 'engine-1'],
		['it carries an administrative deactivation reason', { $set: { inactiveReason: 'deactivated' } }, 'engine-1'],
	])('refuses, changing nothing, when %s', async (_label, change, engineId) => {
		const botId = await insertBot(`ai-agent-${Math.random().toString(36).slice(2, 12)}`);
		if (Object.keys(change).length) {
			await users.col.updateOne({ _id: botId }, change as UpdateFilter<IUser>);
		}
		const before = await users.col.findOne({ _id: botId });

		const result = await users.activateReservedAgentBot(botId, engineId, 'Docs helper');

		expect(result.matchedCount).toBe(0);
		await expect(users.col.findOne({ _id: botId })).resolves.toEqual(before);
	});
});
