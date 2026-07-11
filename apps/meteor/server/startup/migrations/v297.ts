import { upsertPermissions } from '../../lib/authorization/upsertPermissions';
import { addMigration } from '../../lib/migrations';

addMigration({
	version: 297,
	async up() {
		await upsertPermissions();
	},
});
