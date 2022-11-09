import { MongoClient } from 'mongodb';

import * as constants from '../config/constants';
import { createUserFixture } from './collections/users';

export default async function injectInitialData() {
	const connection = await MongoClient.connect(constants.URL_MONGODB);

	const usersFixtures = [createUserFixture('user1'), createUserFixture('user2'), createUserFixture('user3')];

	await Promise.all(
		usersFixtures.map((user) =>
			connection.db().collection('users').updateOne({ username: user.username }, { $set: user }, { upsert: true }),
		),
	);

	await connection
		.db()
		.collection('rocketchat_settings')
		.updateOne({ _id: 'API_Enable_Rate_Limiter_Dev' }, { $set: { value: false } });

	return { usersFixtures };
}
