import { appTokensCollection } from '../../../app/push/server/push';
import { addMigration } from '../../lib/migrations';

addMigration({
	version: 273,
	async up() {
		try {
			return appTokensCollection.rawCollection().dropIndex('userId_1');
		} catch (error: unknown) {
			console.warn('Error dropping index for _raix_push_app_tokens, continuing...');
			console.warn(error);
		}
	},
});
