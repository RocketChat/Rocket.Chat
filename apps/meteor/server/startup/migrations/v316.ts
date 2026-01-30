import { Settings } from '@rocket.chat/models';

import { addMigration } from '../../lib/migrations';

addMigration({
	version: 316,
	name: 'Remove Cloud_Workspace_Access_Token and Cloud_Workspace_Access_Token_Expires_At from the settings collection',
	async up() {
		const accessToken = ((await Settings.getValueById('Cloud_Workspace_Access_Token')) as string) || '';
		const expirationDate = ((await Settings.getValueById('Cloud_Workspace_Access_Token_Expires_At')) as Date) || new Date(0);

		if (accessToken) {
			await Settings.removeById('Cloud_Workspace_Access_Token');
		}

		if (expirationDate) {
			await Settings.removeById('Cloud_Workspace_Access_Token_Expires_At');
		}
	},
});
