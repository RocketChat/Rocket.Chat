import { Settings } from '@rocket.chat/models';

import { addMigration } from '../../lib/migrations';

addMigration({
	version: 176,
	up() {
		return Settings.deleteOne({ _id: 'Livechat', type: 'group' });
	},
});
