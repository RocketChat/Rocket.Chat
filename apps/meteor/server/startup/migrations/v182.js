import { Analytics } from '@rocket.chat/models';

import { addMigration } from '../../lib/migrations';

addMigration({
	version: 182,
	up() {
		Analytics.deleteMany({});
	},
});
