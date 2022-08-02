import { MongoClient } from 'mongodb';

import * as constants from '../config/constants';
import * as users from './collections/users';

export default async function injectInitialData() {
	const connection = await MongoClient.connect(constants.URL_MONGODB);

	await connection.db().collection('users').updateOne({ username: 'user1' }, { $set: users.user1 }, { upsert: true });
	await connection.db().collection('users').updateOne({ username: 'user2' }, { $set: users.user2 }, { upsert: true });

	await connection
		.db()
		.collection('rocketchat_settings')
		.updateOne({ _id: 'API_Enable_Rate_Limiter_Dev' }, { $set: { value: false } });
}
