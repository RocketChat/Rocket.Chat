import { Meteor } from 'meteor/meteor';
import Future from 'fibers/future';

import { Users, Subscriptions } from '../../../app/models/server/raw';
import { addMigration } from '../../lib/migrations';

const batchSize = 5000;

async function migrateUserRecords(total, current) {
	console.log(`Migrating ${current}/${total}`);

	const items = await Users.find({ __rooms: { $exists: false } }, { projection: { _id: 1 } })
		.limit(batchSize)
		.toArray();

	const actions = [];

	for await (const user of items) {
		const rooms = await Subscriptions.find(
			{
				'u._id': user._id,
				't': { $nin: ['d', 'l'] },
			},
			{ projection: { rid: 1 } },
		).toArray();

		actions.push({
			updateOne: {
				filter: { _id: user._id },
				update: {
					$set: {
						__rooms: rooms.map(({ rid }) => rid),
					},
				},
			},
		});
	}

	if (actions.length === 0) {
		return;
	}

	const batch = await Users.col.bulkWrite(actions, { ordered: false });
	if (actions.length === batchSize) {
		await batch;
		return migrateUserRecords(total, current + batchSize);
	}

	return batch;
}

addMigration({
	version: 199,
	up() {
		const fut = new Future();

		console.log('Changing schema of User records, this may take a long time ...');

		Meteor.setTimeout(async () => {
			const users = Users.find({ __rooms: { $exists: false } }, { projection: { _id: 1 } });
			const total = await users.count();
			await users.close();

			if (total < batchSize * 10) {
				await migrateUserRecords(total, 0);
				return fut.return();
			}

			await migrateUserRecords(total, 0);

			fut.return();
		}, 250);

		fut.wait();

		console.log('Changing schema of User records finished.');
	},
});
