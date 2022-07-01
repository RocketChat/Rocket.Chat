import { MongoInternals } from 'meteor/mongo';

import { addMigration } from '../../lib/migrations';

// Remove Deprecated Omnichannel Queue Collection
addMigration({
	version: 274,
	async up() {
		// Remove collection
		try {
			const { mongo } = MongoInternals.defaultRemoteCollectionDriver();
			await mongo.db.dropCollection('rocketchat_omnichannel_queue');
		} catch (e: any) {
			// ignore
			console.warn('Error deleting collection. Perhaps collection was already deleted?');
		}
	},
});
