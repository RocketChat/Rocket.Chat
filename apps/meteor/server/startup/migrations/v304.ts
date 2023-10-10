import { Settings } from '@rocket.chat/models';

import { addMigration } from '../../lib/migrations';

addMigration({
	version: 304,
	name: 'Check if workspace is registered and set it to pending',
	async up() {
		const cloudWorkspaceClientId = await Settings.findOne({ _id: 'Cloud_Workspace_Client_Id' });
		const cloudWorkspaceClientSecret = await Settings.findOne({ _id: 'Cloud_Workspace_Client_Secret' });

		if (cloudWorkspaceClientId?.value || cloudWorkspaceClientSecret?.value) {
			return;
		}

		await Settings.updateMany(
			{
				_id: 'Show_Setup_Wizard',
			},
			{ $set: { value: 'pending' } },
		);
	},
});
