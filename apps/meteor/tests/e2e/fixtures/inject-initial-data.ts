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

	Promise.all(
		[
			{
				_id: 'Country',
				value: 'brazil',
			},
			{
				_id: 'Organization_Type',
				value: 'community',
			},
			{
				_id: 'Industry',
				value: 'aerospaceDefense',
			},
			{
				_id: 'Size',
				value: 0,
			},
			{
				_id: 'Organization_Name',
				value: 'any_name',
			},
		].map((setting) =>
			connection
				.db()
				.collection('rocketchat_settings')
				.updateOne({ _id: setting._id }, { $set: { value: setting.value } }),
		),
	);

	await connection
		.db()
		.collection('rocketchat_settings')
		.updateOne({ _id: 'API_Enable_Rate_Limiter_Dev' }, { $set: { value: false } });

	return { usersFixtures };
}
