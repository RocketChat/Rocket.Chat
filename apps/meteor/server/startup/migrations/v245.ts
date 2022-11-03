import { Permissions } from '@rocket.chat/models';

import { addMigration } from '../../lib/migrations';

addMigration({
	version: 245,
	up() {
		Permissions.create('mobile-download-file', ['user', 'admin']);
		Permissions.create('mobile-upload-file', ['user', 'admin']);
	},
});
