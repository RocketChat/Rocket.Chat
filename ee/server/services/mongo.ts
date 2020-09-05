
import { MongoClient, Db, Collection } from 'mongodb';

const {
	MONGO_URL = 'mongodb://localhost:27017/rocketchat',
} = process.env;

const name = /^mongodb:\/\/.*?(?::[0-9]+)?\/([^?]*)/.exec(MONGO_URL)?.[1];

const client = new MongoClient(MONGO_URL, {
	useNewUrlParser: true,
});

export enum Collections {
	Subscriptions = 'rocketchat_subscription',
	UserSession = 'usersSessions',
	User = 'users',
	Trash = 'rocketchat_trash',
	Messages = 'rocketchat_message',
	Rooms = 'rocketchat_room',
	Settings = 'rocketchat_settings',
}

let db: Db;
export async function getConnection(): Promise<Db> {
	if (!db) {
		await client.connect();
		db = client.db(name);
	}

	return db;
}

export async function getCollection<T>(name: Collections): Promise<Collection<T>> {
	await getConnection();
	return db.collection<T>(name);
}
