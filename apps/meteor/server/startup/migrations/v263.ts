import { MongoInternals } from 'meteor/mongo';

import { addMigration } from '../../lib/migrations';

addMigration({
	version: 263,
	async up() {
		const { mongo } = MongoInternals.defaultRemoteCollectionDriver();
		const integrationHistory = mongo.db.collection('rocketchat_integration_history');

		await integrationHistory.dropIndex('_updatedAt_1');
		await integrationHistory.createIndex({ _updatedAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });
	},
});
