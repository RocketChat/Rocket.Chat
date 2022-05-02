import { MongoClient } from 'mongodb';
import type { Db, Collection } from 'mongodb';

const { MONGO_URL = 'mongodb://localhost:27017/rocketchat' } = process.env;

const name = /^mongodb:\/\/.*?(?::[0-9]+)?\/([^?]*)/.exec(MONGO_URL)?.[1];

export enum Collections {
	Subscriptions = 'rocketchat_subscription',
	UserSession = 'usersSessions',
	User = 'users',
	Trash = 'rocketchat_trash',
	Messages = 'rocketchat_message',
	Rooms = 'rocketchat_room',
	Settings = 'rocketchat_settings',
}

function connectDb(poolSize: number): Promise<MongoClient> {
	const client = new MongoClient(MONGO_URL, {
		useUnifiedTopology: true,
		useNewUrlParser: true,
		poolSize,
	});

	return client.connect().catch((error) => {
		// exits the process in case of any error
		console.error(error);
		process.exit(1);
	});
}

let db: Db;

export const getConnection = ((): ((poolSize?: number) => Promise<Db>) => {
	let client: Promise<MongoClient>;

	return async (poolSize = 5): Promise<Db> => {
		if (db) {
			return db;
		}
		if (!client) {
			client = connectDb(poolSize);
			client.then((c) => {
				db = c.db(name);
			});
		}
		// if getConnection was called multiple times before it was connected, wait for the connection
		return (await client).db(name);
	};
})();

export async function getCollection<T>(name: Collections): Promise<Collection<T>> {
	if (!db) {
		db = await getConnection();
	}
	return db.collection<T>(name);
}
