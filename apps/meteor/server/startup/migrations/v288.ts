import { upsertPermissions } from '../../../app/authorization/server/functions/upsertPermissions';
import { addMigration } from '../../lib/migrations';

addMigration({
	version: 288,
	async up() {
		await upsertPermissions();
	},
});
