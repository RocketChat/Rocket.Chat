import { Settings } from '../../../models';

import { retrieveRegistrationStatus } from './retrieveRegistrationStatus';

export function unregisterWorkspace() {
	const { workspaceRegistered } = retrieveRegistrationStatus();
	if (!workspaceRegistered) {
		return true;
	}

	Settings.removeById('Cloud_Workspace_Id');
	Settings.removeById('Cloud_Workspace_Name');
	Settings.removeById('Cloud_Workspace_Client_Id');
	Settings.removeById('Cloud_Workspace_Client_Secret');
	Settings.removeById('Cloud_Workspace_Client_Secret_Expires_At');
	Settings.removeById('Cloud_Workspace_Registration_Client_Uri');

	// So doesn't try to register again automatically
	Settings.updateValueById('Register_Server', false);

	return true;
}
