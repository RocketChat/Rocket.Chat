import { Settings } from '@rocket.chat/models';

export async function ensureCloudWorkspaceRegistered(): Promise<void> {
	const cloudWorkspaceClientId = await Settings.getValueById('Cloud_Workspace_Client_Id');
	const cloudWorkspaceClientSecret = await Settings.getValueById('Cloud_Workspace_Client_Secret');
	const showSetupWizard = await Settings.getValueById('Show_Setup_Wizard');

	// skip if both fields are already set, which means the workspace is already registered
	if (!!cloudWorkspaceClientId && !!cloudWorkspaceClientSecret) {
		return;
	}

	// skip if the setup wizard still not completed
	if (showSetupWizard !== 'completed') {
		return;
	}

	// otherwise, set the setup wizard to in_progress forcing admins to complete the registration
	await Settings.updateValueById('Show_Setup_Wizard', 'in_progress');
}
