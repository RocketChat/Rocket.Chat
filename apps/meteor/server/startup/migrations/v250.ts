import { addMigration } from '../../lib/migrations';
import { Permissions } from '../../../app/models/server/raw';

addMigration({
	version: 250,
	up() {
		Permissions.removeById('mobile-download-file');
	},
});
