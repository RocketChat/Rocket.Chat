import { Settings } from '@rocket.chat/models';

import { retrieveRegistrationStatus } from './retrieveRegistrationStatus';

export async function unregisterWorkspace() {
	const { workspaceRegistered } = retrieveRegistrationStatus();
	if (!workspaceRegistered) {
		return true;
	}

	await Promise.all([
		Settings.updateValueById('Cloud_Workspace_Id', null),
		Settings.updateValueById('Cloud_Workspace_Name', null),
		Settings.updateValueById('Cloud_Workspace_Client_Id', null),
		Settings.updateValueById('Cloud_Workspace_Client_Secret', null),
		Settings.updateValueById('Cloud_Workspace_Client_Secret_Expires_At', null),
		Settings.updateValueById('Cloud_Workspace_PublicKey', null),
		Settings.updateValueById('Cloud_Workspace_Registration_Client_Uri', null),
	]);

	return true;
}
