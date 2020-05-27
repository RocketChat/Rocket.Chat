import { Meteor } from 'meteor/meteor';

import { Migrations } from '../../migrations';
import { Messages, Rooms, LivechatPageVisited } from '../../../app/models';

let pageVisitedCollection;
let messageCollection;
let roomCollection;

const roomIdByToken = {};

const batchSize = 5000;

async function migrateHistory(total, current) {
	console.log(`Livechat history migration ${ current }/${ total }`);

	const items = await pageVisitedCollection.find({}).limit(batchSize).toArray();

	const tokens = items.filter((item) => item.token && !roomIdByToken[item.token]).map((item) => item.token);
	const rooms = await roomCollection.find({
		'v.token': {
			$in: tokens,
		},
	}, {
		fields: {
			'v.token': 1,
		},
	}).toArray();

	rooms.forEach((room) => {
		roomIdByToken[room.v.token] = room._id;
	});

	const actions = items.reduce((result, item) => {
		const msg = {
			t: 'livechat_navigation_history',
			rid: roomIdByToken[item.token] || null, // prevent from being `undefined`
			ts: item.ts,
			msg: `${ item.page.title } - ${ item.page.location.href }`,
			u: {
				_id: 'rocket.cat',
				username: 'rocket.cat',
			},
			groupable: false,
			navigation: {
				page: item.page,
				token: item.token,
			},
		};
		if (!roomIdByToken[item.token] && item.expireAt) {
			msg.expireAt = item.expireAt;
		}
		result.insert.push(msg);
		result.remove.push(item._id);

		return result;
	}, { insert: [], remove: [] });

	const ops = [];

	if (actions.insert.length > 0) {
		ops.push(messageCollection.insertMany(actions.insert));
	}

	if (actions.remove.length > 0) {
		ops.push(pageVisitedCollection.removeMany({ _id: { $in: actions.remove } }));
	}

	const batch = Promise.all(ops);
	if (actions.remove.length === batchSize) {
		await batch;
		return migrateHistory(total, current + batchSize);
	}

	return batch;
}


Migrations.add({
	version: 123,
	up() {
		pageVisitedCollection = LivechatPageVisited.model.rawCollection();
		messageCollection = Messages.model.rawCollection();
		roomCollection = Rooms.model.rawCollection();

		/*
		 * Move visitor navigation history to messages
		 */
		Meteor.setTimeout(async () => {
			const pages = pageVisitedCollection.find({});
			const total = await pages.count();
			await pages.close();

			console.log('Migrating livechat visitors navigation history to livechat messages. This might take a long time ...');

			await migrateHistory(total, 0);

			console.log('Livechat visitors navigation history migration finished.');
		}, 1000);
	},
});
