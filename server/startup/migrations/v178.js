import { Meteor } from 'meteor/meteor';

import { Migrations } from '../../../app/migrations/server';
import { Rooms } from '../../../app/models/server';

const batchSize = 5000;

const getIds = (_id) => {
	if (_id.length === 17) {
		return [_id];
	}

	if (_id.match(/rocket\.cat/)) {
		return [
			'rocket.cat',
			_id.replace('rocket.cat', ''),
		];
	}

	const total = _id.length;

	const id1 = _id.substr(0, Math.ceil(total / 2));
	const id2 = _id.substr(Math.ceil(total / 2));

	// if (id1 === id2) {
	// 	return id1;
	// }

	return [id1, id2];
};

async function migrateDMs(models, total, current) {
	const { roomCollection } = models;

	console.log(`DM rooms schema migration ${ current }/${ total }`);

	const items = await roomCollection.find({ t: 'd', uids: { $exists: false } }, { fields: { _id: 1 } }).limit(batchSize).toArray();

	const actions = items.map((room) => roomCollection.updateOne({ _id: room._id }, {
		$set: {
			uids: getIds(room._id),
		},
	}));

	const batch = Promise.all(actions);
	if (actions.length === batchSize) {
		await batch;
		return migrateDMs(models, total, current + batchSize);
	}

	return batch;
}

Migrations.add({
	version: 178,
	up() {
		const roomCollection = Rooms.model.rawCollection();

		/*
		 * Move visitor navigation history to messages
		 */
		Meteor.setTimeout(async () => {
			const rooms = roomCollection.find({ t: 'd' });
			const total = await rooms.count();
			await rooms.close();

			if (total < batchSize) {
				return migrateDMs({ roomCollection }, total, 0);
			}

			console.log('Changing schema of Direct Message rooms, this may take a long time ...');

			await migrateDMs({ roomCollection }, total, 0);

			console.log('Changing schema of Direct Message rooms finished.');
		}, 1000);
	},
});
