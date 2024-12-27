import { Settings, WorkspaceCredentials } from '@rocket.chat/models';

import { retrieveRegistrationStatus } from './retrieveRegistrationStatus';
import { updateAuditedBySystem } from '../../../../server/settings/lib/auditedSettingUpdates';
import { notifyOnSettingChangedById } from '../../../lib/server/lib/notifyListener';

export async function removeWorkspaceRegistrationInfo() {
	const { workspaceRegistered } = await retrieveRegistrationStatus();
	if (!workspaceRegistered) {
		return true;
	}

	await WorkspaceCredentials.removeAllCredentials();

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
			return updateAuditedBySystem({
				reason: 'removeWorkspaceRegistrationInfo',
			})(Settings.updateValueById, 'Show_Setup_Wizard', 'in_progress');
		}

		return updateAuditedBySystem({ reason: 'removeWorkspaceRegistrationInfo' })(Settings.resetValueById, settingId, null);
	});

	(await Promise.all(promises)).forEach((value, index) => {
		if (value?.modifiedCount) {
			void notifyOnSettingChangedById(settingsIds[index]);
		}
	});

	return true;
}
