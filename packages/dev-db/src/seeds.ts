import { MongoClient } from 'mongodb';

export type SeedProfile = 'minimal' | 'demo' | 'integration';

const FIXED_NOW = new Date('2024-01-01T00:00:00.000Z');

const parseDatabaseName = (mongoUrl: string): string => {
	try {
		const url = new URL(mongoUrl);
		const dbName = url.pathname.replace(/^\//, '');
		return dbName || 'meteor';
	} catch {
		return 'meteor';
	}
};

export const applySeedProfile = async (mongoUrl: string, profile: SeedProfile): Promise<void> => {
	const client = new MongoClient(mongoUrl, { serverSelectionTimeoutMS: 5000 });
	const dbName = parseDatabaseName(mongoUrl);

	await client.connect();
	try {
		const db = client.db(dbName);
		const metaCollection = db.collection<{ _id: string; [key: string]: unknown }>('dev_db_meta');
		const usersCollection = db.collection<{ _id: string; [key: string]: unknown }>('dev_db_users');
		const roomsCollection = db.collection<{ _id: string; [key: string]: unknown }>('dev_db_rooms');
		const messagesCollection = db.collection<{ _id: string; [key: string]: unknown }>('dev_db_messages');
		const integrationJobsCollection = db.collection<{ _id: string; [key: string]: unknown }>('dev_db_integration_jobs');

		await Promise.all([
			metaCollection.deleteMany({}),
			usersCollection.deleteMany({}),
			roomsCollection.deleteMany({}),
			messagesCollection.deleteMany({}),
			integrationJobsCollection.deleteMany({}),
		]);

		await metaCollection.insertOne({
			_id: 'seed-info',
			profile,
			seedVersion: 1,
			seededAt: FIXED_NOW,
		});

		if (profile === 'minimal') {
			await usersCollection.insertOne({
				_id: 'user-admin',
				username: 'admin',
				roles: ['admin'],
				active: true,
				createdAt: FIXED_NOW,
			});
			return;
		}

		await usersCollection.insertMany([
			{
				_id: 'user-admin',
				username: 'admin',
				roles: ['admin'],
				active: true,
				createdAt: FIXED_NOW,
			},
			{
				_id: 'user-bot',
				username: 'demo-bot',
				roles: ['bot'],
				active: true,
				createdAt: FIXED_NOW,
			},
		]);

		await roomsCollection.insertOne({
			_id: 'room-general',
			name: 'general',
			type: 'c',
			createdAt: FIXED_NOW,
		});

		await messagesCollection.insertMany([
			{
				_id: 'msg-001',
				rid: 'room-general',
				u: { _id: 'user-admin', username: 'admin' },
				msg: 'dev-db demo seed message',
				ts: FIXED_NOW,
			},
			{
				_id: 'msg-002',
				rid: 'room-general',
				u: { _id: 'user-bot', username: 'demo-bot' },
				msg: 'hello from deterministic seed',
				ts: FIXED_NOW,
			},
		]);

		if (profile === 'integration') {
			await integrationJobsCollection.insertMany([
				{
					_id: 'job-001',
					name: 'sync-users',
					status: 'pending',
					createdAt: FIXED_NOW,
				},
				{
					_id: 'job-002',
					name: 'sync-rooms',
					status: 'pending',
					createdAt: FIXED_NOW,
				},
			]);
		}
	} finally {
		await client.close();
	}
};
