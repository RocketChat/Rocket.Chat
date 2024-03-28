import { applyLicense } from '@rocket.chat/license';
import { Settings } from '@rocket.chat/models';

import { settings } from '../../../settings/server';
import { syncCloudData } from './syncWorkspace/syncCloudData';

export async function saveRegistrationData({
	workspaceId,
	client_name,
	client_id,
	client_secret,
	client_secret_expires_at,
	publicKey,
	registration_client_uri,
}: {
	workspaceId: string;
	client_name: string;
	client_id: string;
	client_secret: string;
	client_secret_expires_at: number;
	publicKey: string;
	registration_client_uri: string;
}) {
	await saveRegistrationDataBase({
		workspaceId,
		client_name,
		client_id,
		client_secret,
		client_secret_expires_at,
		publicKey,
		registration_client_uri,
	});

	await syncCloudData();
}
function saveRegistrationDataBase({
	workspaceId,
	client_name,
	client_id,
	client_secret,
	client_secret_expires_at,
	publicKey,
	registration_client_uri,
}: {
	workspaceId: string;
	client_name: string;
	client_id: string;
	client_secret: string;
	client_secret_expires_at: number;
	publicKey: string;
	registration_client_uri: string;
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
	]).then(async (...results) => {
		// wait until all the settings are updated before syncing the data
		for await (const retry of Array.from({ length: 10 })) {
			if (
				settings.get('Register_Server') === true &&
				settings.get('Cloud_Workspace_Id') === workspaceId &&
				settings.get('Cloud_Workspace_Name') === client_name &&
				settings.get('Cloud_Workspace_Client_Id') === client_id &&
				settings.get('Cloud_Workspace_Client_Secret') === client_secret &&
				settings.get('Cloud_Workspace_Client_Secret_Expires_At') === client_secret_expires_at &&
				settings.get('Cloud_Workspace_PublicKey') === publicKey &&
				settings.get('Cloud_Workspace_Registration_Client_Uri') === registration_client_uri
			) {
				break;
			}

			if (retry === 9) {
				throw new Error('Failed to save registration data');
			}
			await new Promise((resolve) => setTimeout(resolve, 1000));
		}
		return results;
	});
}

export async function saveRegistrationDataManual({
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
	await saveRegistrationDataBase({
		workspaceId,
		client_name,
		client_id,
		client_secret,
		client_secret_expires_at,
		publicKey,
		registration_client_uri,
	});
	await applyLicense(licenseData.license, true);
}
