import type { CloudConfirmationPollDataPayload } from '@rocket.chat/core-typings';
import { Settings } from '@rocket.chat/models';

import { callbacks } from '../../../../lib/callbacks';

export async function saveRegistrationData({
	workspaceId,
	client_name: clientName,
	client_id: clientId,
	client_secret: clientSecret,
	client_secret_expires_at: clientSecretExpiresAt,
	publicKey,
	registration_client_uri: registrationClientUri,
	licenseData,
}: CloudConfirmationPollDataPayload): Promise<void> {
	await Promise.all([
		Settings.updateValueById('Register_Server', true),
		Settings.updateValueById('Cloud_Workspace_Id', workspaceId),
		Settings.updateValueById('Cloud_Workspace_Name', clientName),
		Settings.updateValueById('Cloud_Workspace_Client_Id', clientId),
		Settings.updateValueById('Cloud_Workspace_Client_Secret', clientSecret),
		Settings.updateValueById('Cloud_Workspace_Client_Secret_Expires_At', clientSecretExpiresAt),
		Settings.updateValueById('Cloud_Workspace_PublicKey', publicKey),
		Settings.updateValueById('Cloud_Workspace_Registration_Client_Uri', registrationClientUri),
		Settings.updateValueById('Cloud_Workspace_License', licenseData.license || ''),
	]);

	callbacks.run('workspaceLicenseChanged', licenseData.license);
}
