import { Settings, WorkspaceCredentials } from '@rocket.chat/models';

import { applyLicense } from '../../../../ee/app/license/server/applyLicense';
import { settings } from '../../../settings/server';
import { syncCloudData } from './syncWorkspace/syncCloudData';

type SaveRegistrationDataDTO = {
	workspaceId: string;
	client_name: string;
	client_id: string;
	client_secret: string;
	client_secret_expires_at: number;
	publicKey: string;
	registration_client_uri: string;
};

type ManualSaveRegistrationDataDTO = SaveRegistrationDataDTO & { licenseData: { license: string } };

export async function saveRegistrationData({
	workspaceId,
	client_name,
	client_id,
	client_secret,
	client_secret_expires_at,
	publicKey,
	registration_client_uri,
}: SaveRegistrationDataDTO) {
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
}: SaveRegistrationDataDTO) {
	return Promise.all([
		WorkspaceCredentials.updateCredential('workspace_id', workspaceId),
		WorkspaceCredentials.updateCredential('workspace_name', client_name),
		WorkspaceCredentials.updateCredential('workspace_public_key', publicKey),
		WorkspaceCredentials.updateCredential('workspace_registration_client_uri', registration_client_uri),

		Settings.updateValueById('Register_Server', true),
		Settings.updateValueById('Cloud_Workspace_Client_Id', client_id),
		Settings.updateValueById('Cloud_Workspace_Client_Secret', client_secret),
		Settings.updateValueById('Cloud_Workspace_Client_Secret_Expires_At', client_secret_expires_at),
	]).then(async (...results) => {
		// wait until all the settings are updated before syncing the data
		for await (const retry of Array.from({ length: 10 })) {
			if (
				settings.get('Register_Server') === true &&
				settings.get('Cloud_Workspace_Client_Id') === client_id &&
				settings.get('Cloud_Workspace_Client_Secret') === client_secret &&
				settings.get('Cloud_Workspace_Client_Secret_Expires_At') === client_secret_expires_at
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
}: ManualSaveRegistrationDataDTO) {
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
