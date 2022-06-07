import { MongoInternals } from 'meteor/mongo';

import { addMigration } from '../../lib/migrations';

// Remove Deprecated Omnichannel Queue Collection
addMigration({
	version: 268,
	async up() {
		// Remove collection
		const { mongo } = MongoInternals.defaultRemoteCollectionDriver();
		await mongo.db.dropCollection('rocketchat_omnichannel_queue');
	},
});
