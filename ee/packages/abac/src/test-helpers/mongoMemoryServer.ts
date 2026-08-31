import { registerModel, UsersRaw, RoomsRaw, AbacAttributesRaw, ServerEventsRaw, SubscriptionsRaw } from '@rocket.chat/models';
import type { Db } from 'mongodb';
import { MongoClient } from 'mongodb';
import { MongoMemoryServer } from 'mongodb-memory-server';

export const SHARED_ABAC_TEST_DB = 'abac_test';

type SharedState = {
	mongo: MongoMemoryServer;
	client: MongoClient;
	refCount: number;
};

let sharedState: SharedState | null = null;
let initialization: Promise<SharedState> | null = null;

const ensureState = async (): Promise<SharedState> => {
	if (sharedState) {
		return sharedState;
	}

	if (!initialization) {
		initialization = (async () => {
			const mongo = await MongoMemoryServer.create();
			const client = await MongoClient.connect(mongo.getUri(), {});
			return {
				mongo,
				client,
				refCount: 0,
			};
		})();
	}

	sharedState = await initialization;
	initialization = null;
	return sharedState;
};

const dropDatabase = async (db: Db) => {
	try {
		await db.dropDatabase();
	} catch (err) {
		if (!(err instanceof Error) || !/ns not found/i.test(err.message)) {
			throw err;
		}
	}
};

export type SharedMongoConnection = {
	mongo: MongoMemoryServer;
	client: MongoClient;
	db: Db;
	cleanupDatabase: () => Promise<void>;
	release: () => Promise<void>;
};

const registerAbacTestModels = (db: Db) => {
	registerModel('IUsersModel', () => new UsersRaw(db));
	registerModel('IRoomsModel', () => new RoomsRaw(db));
	registerModel('IAbacAttributesModel', () => new AbacAttributesRaw(db));
	registerModel('IServerEventsModel', () => new ServerEventsRaw(db));
	registerModel('ISubscriptionsModel', () => new SubscriptionsRaw(db));
};

export const acquireSharedInMemoryMongo = async (dbName: string): Promise<SharedMongoConnection> => {
	const state = await ensureState();
	state.refCount += 1;

	const connectionDb = state.client.db(dbName);
	let released = false;

	registerAbacTestModels(connectionDb);
	return {
		mongo: state.mongo,
		client: state.client,
		db: connectionDb,
		cleanupDatabase: async () => dropDatabase(connectionDb),
		release: async () => {
			if (released || !sharedState) {
				return;
			}

			released = true;
			sharedState.refCount -= 1;

			if (sharedState.refCount === 0) {
				const { client, mongo } = sharedState;
				sharedState = null;
				await client.close();
				await mongo.stop();
			}
		},
	};
};
