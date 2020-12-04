import { MongoInternals } from 'meteor/mongo';

import { Migrations } from '../../../app/migrations';

Migrations.add({
	version: 212,
	async up() {
		const { mongo } = MongoInternals.defaultRemoteCollectionDriver();
		const apps = mongo.db.collection('rocketchat_apps');

		await apps.update({
			status: 'initialized',
		}, {
			$set: {
				status: 'manually_disabled',
			},
		}, {
			multi: true,
		});
	},
});
