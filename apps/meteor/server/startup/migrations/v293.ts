import { upsertPermissions } from '../../lib/authorization/upsertPermissions';
import { addMigration } from '../../lib/migrations';

addMigration({
	version: 293,
	async up() {
		await upsertPermissions();
	},
});
