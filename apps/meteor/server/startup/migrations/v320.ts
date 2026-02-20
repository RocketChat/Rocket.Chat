import { Settings } from '@rocket.chat/models';

import { addMigration } from '../../lib/migrations';

addMigration({
	version: 320,
	async up() {
		await Settings.deleteOne({ _id: 'API_Use_REST_For_DDP_Calls' });
	},
});
