import { MongoClient } from 'mongodb';

import * as constants from '../config/constants';
import { createUserFixture } from './collections/users';
import { Users } from './userStates';

export default async function injectInitialData() {
	const connection = await MongoClient.connect(constants.URL_MONGODB);

	const usersFixtures = [createUserFixture(Users.user1), createUserFixture(Users.user2), createUserFixture(Users.user3)];

	await Promise.all(
		usersFixtures.map((user) =>
			connection.db().collection('users').updateOne({ username: user.username }, { $set: user }, { upsert: true }),
		),
	);

	await connection
		.db()
		.collection('users')
		.updateOne(
			{ username: Users.admin.data.username },
			{ $addToSet: { 'services.resume.loginTokens': { when: Users.admin.data.loginExpire, hashedToken: Users.admin.data.hashedToken } } },
		);

	await Promise.all(
		[
			{
				_id: 'API_Enable_Rate_Limiter_Dev',
				value: false,
			},
			{
				_id: 'Show_Setup_Wizard',
				value: 'completed',
			},
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
			{
				_id: 'API_Enable_Rate_Limiter_Dev',
				value: false,
			},
		].map((setting) =>
			connection
				.db()
				.collection('rocketchat_settings')
				.updateOne({ _id: setting._id }, { $set: { value: setting.value } }),
		),
	);

	return { usersFixtures };
}
