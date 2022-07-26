import { MongoClient } from 'mongodb';
import { IRoom, IUser, ISubscription } from '@rocket.chat/core-typings';

import { URL_MONGODB } from '../constants';
import * as rooms from './collections/rocketchat_room';
import * as users from './collections/users';
import * as subscriptions from './collections/rocketchat_subscription';

export default {
	async up() {
		const connection = await MongoClient.connect(URL_MONGODB);

		await connection.db().collection<IRoom>('rocketchat_room').insertMany([rooms.roomPublic1, rooms.roomPrivate1]);

		await connection.db().collection<IUser>('users').insertMany([users.userSimple1]);

		await connection
			.db()
			.collection<ISubscription>('rocketchat_subscription')
			.insertMany([...subscriptions.userSimple1Subscriptions, ...subscriptions.userAdmin1Subscriptions]);

		await connection.close();
	},

	async down() {
		const connection = await MongoClient.connect(URL_MONGODB);

		await connection
			.db()
			.collection('rocketchat_room')
			.deleteMany({ _id: { $in: [rooms.roomPublic1._id, rooms.roomPrivate1._id] } });

		await connection
			.db()
			.collection('users')
			.deleteMany({
				_id: {
					$in: [users.userSimple1._id],
				},
			});

		await connection
			.db()
			.collection('rocketchat_subscription')
			.deleteMany({
				_id: {
					$in: [...subscriptions.userSimple1Subscriptions, ...subscriptions.userAdmin1Subscriptions].map((i) => i._id),
				},
			});

		await connection.close();
	},
};
