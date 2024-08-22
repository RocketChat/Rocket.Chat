import { applyLicense } from '@rocket.chat/license';
import { Settings } from '@rocket.chat/models';

import { notifyOnSettingChangedById } from '../../../lib/server/lib/notifyListener';
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

async function saveRegistrationDataBase({
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
	const settingsData = [
		{ _id: 'Register_Server', value: true },
		{ _id: 'Cloud_Workspace_Id', value: workspaceId },
		{ _id: 'Cloud_Workspace_Name', value: client_name },
		{ _id: 'Cloud_Workspace_Client_Id', value: client_id },
		{ _id: 'Cloud_Workspace_Client_Secret', value: client_secret },
		{ _id: 'Cloud_Workspace_Client_Secret_Expires_At', value: client_secret_expires_at },
		{ _id: 'Cloud_Workspace_PublicKey', value: publicKey },
		{ _id: 'Cloud_Workspace_Registration_Client_Uri', value: registration_client_uri },
	];

	const promises = settingsData.map(({ _id, value }) => Settings.updateValueById(_id, value));

	(await Promise.all(promises)).forEach((value, index) => {
		if (value?.modifiedCount) {
			void notifyOnSettingChangedById(settingsData[index]._id);
		}
	});

	// TODO: Why is this taking so long that needs a timeout?
	for await (const retry of Array.from({ length: 10 })) {
		const isSettingsUpdated =
			settings.get('Register_Server') === true &&
			settings.get('Cloud_Workspace_Id') === workspaceId &&
			settings.get('Cloud_Workspace_Name') === client_name &&
			settings.get('Cloud_Workspace_Client_Id') === client_id &&
			settings.get('Cloud_Workspace_Client_Secret') === client_secret &&
			settings.get('Cloud_Workspace_Client_Secret_Expires_At') === client_secret_expires_at &&
			settings.get('Cloud_Workspace_PublicKey') === publicKey &&
			settings.get('Cloud_Workspace_Registration_Client_Uri') === registration_client_uri;

		if (isSettingsUpdated) {
			return;
		}

		if (retry === 9) {
			throw new Error('Failed to save registration data');
		}

		await new Promise((resolve) => setTimeout(resolve, 1000));
	}
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
