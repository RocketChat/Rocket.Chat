import { MongoClient } from 'mongodb';
import type { Collection, MongoClientOptions, Document, Db } from 'mongodb';

const { MONGO_URL = 'mongodb://localhost:27017/rocketchat' } = process.env;

const name = /^mongodb:\/\/.*?(?::[0-9]+)?\/([^?]*)/.exec(MONGO_URL)?.[1];

export enum Collections {
	Subscriptions = 'rocketchat_subscription',
	UserSession = 'usersSessions',
	User = 'users',
	Trash = 'rocketchat__trash',
	Messages = 'rocketchat_message',
	Rooms = 'rocketchat_room',
	Settings = 'rocketchat_settings',
}

function connectDb(options?: MongoClientOptions): Promise<MongoClient> {
	const client = new MongoClient(MONGO_URL, options);

	return client.connect().catch((error) => {
		// exits the process in case of any error
		console.error(error);
		process.exit(1);
	});
}

let db: Db;

export const getConnection = ((): ((options?: MongoClientOptions) => Promise<Db>) => {
	let client: MongoClient;

	return async (options): Promise<Db> => {
		if (db) {
			return db;
		}
		if (client == null) {
			client = await connectDb(options);
			db = client.db(name);
		}

		// if getConnection was called multiple times before it was connected, wait for the connection
		return client.db(name);
	};
})();

export async function getCollection<T extends Document>(name: Collections): Promise<Collection<T>> {
	if (!db) {
		db = await getConnection();
	}
	return db.collection<T>(name);
}
