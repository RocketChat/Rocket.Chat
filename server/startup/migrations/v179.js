import { Meteor } from 'meteor/meteor';
import Future from 'fibers/future';

import { addMigration } from '../../lib/migrations';
import { Rooms } from '../../../app/models/server';

const batchSize = 5000;

const getIds = (_id) => {
	// DM alone
	if (_id.length === 17) {
		return [_id];
	}

	// DM with rocket.cat
	if (_id.match(/rocket\.cat/)) {
		return ['rocket.cat', _id.replace('rocket.cat', '')];
	}

	const total = _id.length;

	// regular DMs
	const id1 = _id.substr(0, Math.ceil(total / 2));
	const id2 = _id.substr(Math.ceil(total / 2));

	// buggy (?) DM alone but with duplicated _id
	// if (id1 === id2) {
	// 	return [id1];
	// }

	return [id1, id2];
};

async function migrateDMs(models, total, current) {
	const { roomCollection } = models;

	console.log(`DM rooms schema migration ${current}/${total}`);

	const items = await roomCollection
		.find({ t: 'd', uids: { $exists: false } }, { fields: { _id: 1 } })
		.limit(batchSize)
		.toArray();

	const actions = items.map((room) => ({
		updateOne: {
			filter: { _id: room._id },
			update: {
				$set: {
					uids: getIds(room._id),
				},
			},
		},
	}));

	if (actions.length === 0) {
		return;
	}

	const batch = await roomCollection.bulkWrite(actions, { ordered: false });
	if (actions.length === batchSize) {
		await batch;
		return migrateDMs(models, total, current + batchSize);
	}

	return batch;
}

addMigration({
	version: 179,
	up() {
		const fut = new Future();

		const roomCollection = Rooms.model.rawCollection();

		Meteor.setTimeout(async () => {
			const rooms = roomCollection.find({ t: 'd' });
			const total = await rooms.count();
			await rooms.close();

			if (total < batchSize * 10) {
				await migrateDMs({ roomCollection }, total, 0);
				return fut.return();
			}

			console.log('Changing schema of Direct Message rooms, this may take a long time ...');

			await migrateDMs({ roomCollection }, total, 0);

			console.log('Changing schema of Direct Message rooms finished.');

			fut.return();
		}, 200);

		fut.wait();
	},
});
