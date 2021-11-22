import { addMigration } from '../../lib/migrations';
import { Permissions } from '../../../app/models/server/raw';

addMigration({
	version: 245,
	up() {
		Permissions.create('mobile-download-file', ['user', 'admin']);
		Permissions.create('mobile-upload-file', ['user', 'admin']);
	},
});
