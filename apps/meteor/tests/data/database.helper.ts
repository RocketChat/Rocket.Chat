import type { Db } from 'mongodb';
import { MongoClient } from 'mongodb';

import { URL_MONGODB } from '../e2e/config/constants';

export const withDatabase = async <T>(fn: (db: Db) => Promise<T>): Promise<T> => {
	const connection = await MongoClient.connect(URL_MONGODB);
	try {
		return await fn(connection.db());
	} finally {
		await connection.close();
	}
};
