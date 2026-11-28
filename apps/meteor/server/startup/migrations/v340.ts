import { Settings } from '@rocket.chat/models';

import { addMigration } from '../../lib/migrations';

addMigration({
	version: 340,
	name: 'Remove Push_UseLegacy, Push_gcm_project_number and Push_gcm_api_key settings',
	async up() {
		await Settings.deleteMany({ _id: { $in: ['Push_UseLegacy', 'Push_gcm_project_number', 'Push_gcm_api_key'] } });
	},
});
