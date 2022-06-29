import { Permissions } from '@rocket.chat/models';

import { addMigration } from '../../lib/migrations';

addMigration({
	version: 230,
	up() {
		return Promise.all([Permissions.addRole('start-discussion', 'app'), Permissions.addRole('start-discussion-other-user', 'app')]);
	},
});
