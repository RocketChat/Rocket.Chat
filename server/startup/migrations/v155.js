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
	version: 155,
	up() {
		try {
			// Delete all old, deprecated tables
			Promise.await(federationEventsCollection.rawCollection().drop());
		} catch (err) {
			// Ignore if the collection does not exist
			if (!err.code || err.code !== 26) {
				throw err;
			}
		}

		// Make sure we keep only the valid settings
		Settings.remove({ $and: [{ _id: /FEDERATION/ }, { _id: { $nin: validSettings } }] });

		// Normalize the federation property on all collections

		// Update rooms
		const rooms = Rooms.find({ federation: { $exists: true } });

		Rooms.update({ _id: { $in: rooms.map((r) => r._id) } }, { $unset: { federation: 1 } }, { multi: true });

		// Update all subscriptions
		for (const r of rooms) {
			Subscriptions.update({ rid: r._id }, { $unset: { federation: 1 } }, { multi: true });
		}

		// Update all users
		const users = Users.find({ federation: { $exists: true } });

		users.forEach((u) => {
			const [name, domain] = u.username.split('@');

			// If there is a domain it means it a remote user
			if (domain) {
				const username = `${ name }@old-${ domain }`;

				Users.update({ _id: u._id }, { $unset: { federation: 1, emails: 1, isRemote: 1 }, $set: { username, active: false, status: 'offline' } });
			} else {
				Users.update({ _id: u._id }, { $unset: { federation: 1 } });
			}
		});

		// Update all messages
		// We will not update the mentions and channels here
		Messages.update({ federation: { $exists: true } }, { $unset: { federation: 1 } }, { multi: true });

		// Update all uploads
		Uploads.update({ federation: { $exists: true } }, { $unset: { federation: 1 } }, { multi: true });
	},
	down() {
		// Down migration does not apply in this case
	},
});
