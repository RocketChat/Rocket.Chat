import { Settings } from '@rocket.chat/models';

import { callbacks } from '../../../../lib/callbacks';

export function saveRegistrationData({
	workspaceId,
	client_name,
	client_id,
	client_secret,
	client_secret_expires_at,
	publicKey,
	registration_client_uri,
	licenseData,
}: {
	workspaceId: string;
	client_name: string;
	client_id: string;
	client_secret: string;
	client_secret_expires_at: number;
	publicKey: string;
	registration_client_uri: string;
	licenseData: {
		license: string;
	};
}) {
	return Promise.all([
		Settings.updateValueById('Register_Server', true),
		Settings.updateValueById('Cloud_Workspace_Id', workspaceId),
		Settings.updateValueById('Cloud_Workspace_Name', client_name),
		Settings.updateValueById('Cloud_Workspace_Client_Id', client_id),
		Settings.updateValueById('Cloud_Workspace_Client_Secret', client_secret),
		Settings.updateValueById('Cloud_Workspace_Client_Secret_Expires_At', client_secret_expires_at),
		Settings.updateValueById('Cloud_Workspace_PublicKey', publicKey),
		Settings.updateValueById('Cloud_Workspace_Registration_Client_Uri', registration_client_uri),
		Settings.updateValueById('Cloud_Workspace_License', licenseData.license || ''),
	]).then(async (...results) => {
		await callbacks.run('workspaceLicenseChanged', licenseData.license);
		return results;
	});
}
