import { Settings } from '@rocket.chat/models';

export async function ensureCloudWorkspaceRegistered(): Promise<void> {
	const cloudWorkspaceClientId = await Settings.getValueById('Cloud_Workspace_Client_Id');
	const cloudWorkspaceClientSecret = await Settings.getValueById('Cloud_Workspace_Client_Secret');
	const showSetupWizard = await Settings.findOneById('Show_Setup_Wizard', {
		projection: { value: 1, valueSource: 1, processEnvValue: 1 },
	});

	// skip if both fields are already set, which means the workspace is already registered
	if (!!cloudWorkspaceClientId && !!cloudWorkspaceClientSecret) {
		return;
	}

	// skip if the setup wizard still not completed
	if (showSetupWizard?.value !== 'completed') {
		return;
	}

	// skip if the value was pinned via env override (e.g. air-gapped deployments) and hasn't
	// been changed since; forcing the wizard would fight the operator's explicit config
	if (showSetupWizard.valueSource === 'processEnvValue' && showSetupWizard.value === showSetupWizard.processEnvValue) {
		return;
	}

	// otherwise, set the setup wizard to in_progress forcing admins to complete the registration
	await Settings.updateValueById('Show_Setup_Wizard', 'in_progress');
}
