
import { MongoClient, Db } from 'mongodb';

const {
	MONGO_URL = 'mongodb://localhost:27017/rocketchat',
} = process.env;

const name = /^mongodb:\/\/.*?(?::[0-9]+)?\/([^?]*)/.exec(MONGO_URL)?.[1];

const client = new MongoClient(MONGO_URL, {
	useNewUrlParser: true,
});

let db: Db;
export async function getConnection(): Promise<Db> {
	if (!db) {
		await client.connect();
		db = client.db(name);
	}

	return db;
}
