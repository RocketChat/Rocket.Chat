import { Settings } from '@rocket.chat/models';

import { addMigration } from '../../lib/migrations';

addMigration({
	version: 339,
	name: 'Remove Troubleshoot_Disable_Statistics_Generator and Troubleshoot_Disable_Workspace_Sync settings',
	async up() {
		await Settings.deleteMany({ _id: { $in: ['Troubleshoot_Disable_Statistics_Generator', 'Troubleshoot_Disable_Workspace_Sync'] } });
	},
});
