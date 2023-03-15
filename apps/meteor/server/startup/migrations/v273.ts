import { appTokensCollection } from '../../../app/push/server/push';
import { addMigration } from '../../lib/migrations';

addMigration({
	version: 273,
	async up() {
		try {
			await appTokensCollection.rawCollection().dropIndex('userId_1');
			return;
		} catch (error: unknown) {
			console.warn('Error dropping index for _raix_push_app_tokens, continuing...');
			console.warn(error);
		}
	},
});
