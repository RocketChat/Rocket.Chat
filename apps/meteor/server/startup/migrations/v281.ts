import { Banners } from '@rocket.chat/models';

import { addMigration } from '../../lib/migrations';

addMigration({
	version: 281,
	async up() {
		// TODO: remove device management records from banner_dismiss collection, incase we decide not to use it in future
		await Banners.removeById('device-management');
	},
});
