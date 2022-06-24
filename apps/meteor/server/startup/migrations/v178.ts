import { Settings } from '@rocket.chat/models';

import { addMigration } from '../../lib/migrations';

addMigration({
	version: 178,
	up() {
		return Settings.removeById('Livechat_enable_inquiry_fetch_by_stream');
	},
});
