import { upsertPermissions } from '../../../app/authorization/server/functions/upsertPermissions';
import { addMigration } from '../../lib/migrations';

addMigration({
	version: 305,
	async up() {
		await upsertPermissions();
	},
});
