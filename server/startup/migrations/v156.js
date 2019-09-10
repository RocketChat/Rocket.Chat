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

const federationEventsCollection = new Mongo.Collection('rocketchat_federation_events');

Migrations.add({
	version: 156,
	up() {
		try {
			// Delete all old, deprecated tables
			console.log('drop collection');
			Promise.await(federationEventsCollection.rawCollection().drop());
		} catch (err) {
			// Ignore if the collection does not exist
			if (!err.code || err.code !== 26) {
				throw err;
			}
		}

		// Make sure we keep only the valid settings
		console.log('remove old settings');
		Settings.remove({ $and: [{ _id: /FEDERATION/ }, { _id: { $nin: validSettings } }] });

		// Normalize the federation property on all collections

		// Update rooms
		console.log('update rooms');
		Rooms.update({ federation: { $exists: true } }, { $unset: { federation: 1 } }, { multi: true });

		// Update all subscriptions
		console.log('update subscriptions');
		Subscriptions.update({ federation: { $exists: true } }, { $unset: { federation: 1 } }, { multi: true });

		// Update all users
		console.log('update remote users');
		Users.find({ isRemote: true }).forEach((u) => {
			const [name, domain] = u.username.split('@');

			const username = `${ name }@old-${ domain }`;

			Users.update({ _id: u._id }, {
				$unset: { federation: 1, emails: 1, isRemote: 1 },
				$set: { username, active: false, status: 'offline' },
			});
		});

		console.log('update local users');
		Users.update({ federation: { $exists: true } }, { $unset: { federation: 1 } }, { multi: true });

		// Update all messages
		// We will not update the mentions and channels here
		console.log('update messages');
		Messages.update({ federation: { $exists: true } }, { $unset: { federation: 1 } }, { multi: true });

		// Update all uploads
		console.log('update uploads');
		Uploads.update({ federation: { $exists: true } }, { $unset: { federation: 1 } }, { multi: true });
	},
	down() {
		// Down migration does not apply in this case
	},
});
