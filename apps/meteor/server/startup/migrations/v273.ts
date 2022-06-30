import { appTokensCollection } from '../../../app/push/server/push';
import { addMigration } from '../../lib/migrations';

addMigration({
	version: 273,
	async up() {
		return appTokensCollection.rawCollection().dropIndex('userId_1');
	},
});
