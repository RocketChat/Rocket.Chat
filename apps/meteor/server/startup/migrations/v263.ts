import { MongoInternals } from 'meteor/mongo';

import { addMigration } from '../../lib/migrations';

addMigration({
	version: 263,
	async up() {
		const { mongo } = MongoInternals.defaultRemoteCollectionDriver();
		const integrationHistory = mongo.db.collection('rocketchat_integration_history');

		try {
			await integrationHistory.dropIndex('_updatedAt_1');
			await integrationHistory.createIndex({ _updatedAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });
		} catch (error: unknown) {
			console.warn('Error recreating index for rocketchat_integration_history, continuing...');
			console.warn(error);
		}
	},
});
