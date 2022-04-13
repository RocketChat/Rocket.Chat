import { MongoInternals } from 'meteor/mongo';

import { addMigration } from '../../lib/migrations';

addMigration({
	version: 212,
	up() {
		const { mongo } = MongoInternals.defaultRemoteCollectionDriver();
		const apps = mongo.db.collection('rocketchat_apps');

		Promise.await(
			apps.updateMany(
				{
					status: 'initialized',
				},
				{
					$set: {
						status: 'manually_disabled',
					},
				},
			),
		);
	},
});
