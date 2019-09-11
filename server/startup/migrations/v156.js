import { Mongo } from 'meteor/mongo';

import { Migrations } from '../../../app/migrations/server';
import {
	Messages,
	Rooms,
	Subscriptions,
	Users,
	Uploads,
	Settings,
} from '../../../app/models/server';

const validSettings = [
	'FEDERATION_Enabled',
	'FEDERATION_Domain',
	'FEDERATION_Public_Key',
	'FEDERATION_Discovery_Method',
	'FEDERATION_Test_Setup',
];

const updateLocalUsers = () => {
	console.log('Migration: update local users');
	const options = {
		fields: { _id: 1 },
		limit: 500,
	};
	const users = Users.find({ federation: { $exists: true } }, options).fetch();

	const ids = users.map((u) => u._id);
	if (ids.length === 0) {
		return;
	}

	Users.update({ _id: { $in: ids } }, { $unset: { federation: 1 } }, { multi: true });

	// if removed 500 users probably there is more to remove, so call it again
	if (ids.length === 500) {
		return updateLocalUsers();
	}
};

const federationEventsCollection = new Mongo.Collection('rocketchat_federation_events');

Migrations.add({
	version: 156,
	up() {
		try {
			// Delete all old, deprecated tables
			console.log('Migration: drop collection');
			Promise.await(federationEventsCollection.rawCollection().drop());
		} catch (err) {
			// Ignore if the collection does not exist
			if (!err.code || err.code !== 26) {
				throw err;
			}
		}

		// Make sure we keep only the valid settings
		console.log('Migration: remove old settings');
		Settings.remove({ $and: [{ _id: /FEDERATION/ }, { _id: { $nin: validSettings } }] });

		// Normalize the federation property on all collections

		// Update rooms
		console.log('Migration: update rooms');
		Rooms.update({ federation: { $exists: true } }, { $unset: { federation: 1 } }, { multi: true });

		// Update all subscriptions
		console.log('Migration: update subscriptions');
		Subscriptions.update({ federation: { $exists: true } }, { $unset: { federation: 1 } }, { multi: true });

		// Update all users
		console.log('Migration: update remote users');
		Users.find({ isRemote: true }).forEach((u) => {
			const [name, domain] = u.username.split('@');

			const username = `${ name }@old-${ domain }`;

			Users.update({ _id: u._id }, {
				$unset: { federation: 1, emails: 1, isRemote: 1 },
				$set: { username, active: false, status: 'offline' },
			});
		});

		updateLocalUsers();

		// Update all messages
		// We will not update the mentions and channels here
		console.log('Migration: update messages');
		Messages.update({ federation: { $exists: true } }, { $unset: { federation: 1 } }, { multi: true });

		// Update all uploads
		console.log('Migration: update uploads');
		Uploads.update({ federation: { $exists: true } }, { $unset: { federation: 1 } }, { multi: true });
	},
	down() {
		// Down migration does not apply in this case
	},
});
