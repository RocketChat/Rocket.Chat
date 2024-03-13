import { Settings, WorkspaceCredentials } from '@rocket.chat/models';

import { retrieveRegistrationStatus } from './retrieveRegistrationStatus';

export async function removeWorkspaceRegistrationInfo() {
	const { workspaceRegistered } = await retrieveRegistrationStatus();
	if (!workspaceRegistered) {
		return true;
	}

	await Promise.all([
		WorkspaceCredentials.unsetCredentialValue('workspace_public_key'),
		WorkspaceCredentials.unsetCredentialValue('workspace_registration_client_uri'),
		WorkspaceCredentials.unsetCredentialValue('workspace_id'),
		WorkspaceCredentials.unsetCredentialValue('workspace_name'),

		Settings.resetValueById('Cloud_Workspace_Client_Id', null),
		Settings.resetValueById('Cloud_Workspace_Client_Secret', null),
		Settings.resetValueById('Cloud_Workspace_Client_Secret_Expires_At', null),
	]);

	await Settings.updateValueById('Show_Setup_Wizard', 'in_progress');
	return true;
}
