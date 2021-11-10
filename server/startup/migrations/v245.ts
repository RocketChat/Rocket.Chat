import { addMigration } from '../../lib/migrations';
import { Permissions } from '../../../app/models/server';

addMigration({
	version: 245,
	up() {
		Permissions.create('mobile-download-file', ['user', 'admin']);
		Permissions.create('mobile-upload-file', ['user', 'admin']);
	},
});
