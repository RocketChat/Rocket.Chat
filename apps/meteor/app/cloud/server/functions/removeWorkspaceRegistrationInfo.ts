import { Settings } from '@rocket.chat/models';

import { notifyOnSettingChangedById } from '../../../lib/server/lib/notifyListener';
import { retrieveRegistrationStatus } from './retrieveRegistrationStatus';

export async function removeWorkspaceRegistrationInfo() {
	const { workspaceRegistered } = await retrieveRegistrationStatus();
	if (!workspaceRegistered) {
		return true;
	}

	const settingsIds = [
		'Cloud_Workspace_Id',
		'Cloud_Workspace_Name',
		'Cloud_Workspace_Client_Id',
		'Cloud_Workspace_Client_Secret',
		'Cloud_Workspace_Client_Secret_Expires_At',
		'Cloud_Workspace_PublicKey',
		'Cloud_Workspace_Registration_Client_Uri',
		'Show_Setup_Wizard',
	];

	const promises = settingsIds.map((settingId) => {
		if (settingId === 'Show_Setup_Wizard') {
			return Settings.updateValueById('Show_Setup_Wizard', 'in_progress');
		}

		return Settings.resetValueById(settingId, null);
	});

	(await Promise.all(promises)).forEach((value, index) => {
		if (value?.modifiedCount) {
			void notifyOnSettingChangedById(settingsIds[index]);
		}
	});

	return true;
}
