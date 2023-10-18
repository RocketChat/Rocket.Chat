import { Settings } from '@rocket.chat/models';

export async function ensureCloudWorkspaceRegistered(): Promise<void> {
	const projection = { projection: { value: 1 } };

	const cloudWorkspaceClientId = await Settings.findOneById('Cloud_Workspace_Client_Id', projection);
	const cloudWorkspaceClientSecret = await Settings.findOneById('Cloud_Workspace_Client_Secret', projection);

	// skip if both fields are already set, which means the workspace is already registered
	if (!!cloudWorkspaceClientId?.value && !!cloudWorkspaceClientSecret?.value) {
		return;
	}

	// otherwise, set the setup wizard to in_progress forcing admins to complete the registration
	await Settings.updateValueById('Show_Setup_Wizard', 'in_progress');
}
