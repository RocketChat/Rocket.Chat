import { Settings, WorkspaceCredentials } from '@rocket.chat/models';

import { retrieveRegistrationStatus } from './retrieveRegistrationStatus';

export async function removeWorkspaceRegistrationInfo() {
	const { workspaceRegistered } = await retrieveRegistrationStatus();
	if (!workspaceRegistered) {
		return true;
	}

	await Promise.all([
		WorkspaceCredentials.removeAllCredentials(),

		Settings.resetValueById('Cloud_Workspace_Client_Id', null),
		Settings.resetValueById('Cloud_Workspace_Client_Secret', null),
		Settings.resetValueById('Cloud_Workspace_Client_Secret_Expires_At', null),
		Settings.resetValueById('Cloud_Workspace_PublicKey', null),
		Settings.resetValueById('Cloud_Workspace_Registration_Client_Uri', null),
		Settings.resetValueById('Cloud_Workspace_Id', null),
		Settings.resetValueById('Cloud_Workspace_Name', null),
	]);

	await Settings.updateValueById('Show_Setup_Wizard', 'in_progress');
	return true;
}
