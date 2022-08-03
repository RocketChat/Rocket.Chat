import { Settings } from '@rocket.chat/models';

import { retrieveRegistrationStatus } from './retrieveRegistrationStatus';

export async function unregisterWorkspace() {
	const { workspaceRegistered } = retrieveRegistrationStatus();
	if (!workspaceRegistered) {
		return true;
	}

	Settings.updateValueById('Cloud_Workspace_Id', undefined);
	Settings.updateValueById('Cloud_Workspace_Name', undefined);
	Settings.updateValueById('Cloud_Workspace_Client_Id', undefined);
	Settings.updateValueById('Cloud_Workspace_Client_Secret', undefined);
	Settings.updateValueById('Cloud_Workspace_Client_Secret_Expires_At', undefined);
	Settings.updateValueById('Cloud_Workspace_PublicKey', undefined);
	Settings.updateValueById('Cloud_Workspace_Registration_Client_Uri', undefined);

	return true;
}
