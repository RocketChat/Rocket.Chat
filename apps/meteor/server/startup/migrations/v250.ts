import { Permissions } from '@rocket.chat/models';

import { addMigration } from '../../lib/migrations';

addMigration({
	version: 250,
	up() {
		Permissions.removeById('mobile-download-file');
	},
});
