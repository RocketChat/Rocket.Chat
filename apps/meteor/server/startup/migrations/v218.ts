import { Statistics } from '@rocket.chat/models';

import { addMigration } from '../../lib/migrations';

addMigration({
	version: 218,
	up() {
		// TODO test if dropIndex do not raise exceptions.
		Statistics.col.dropIndex('createdAt_1');
	},
});
