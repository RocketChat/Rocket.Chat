import { Cloud } from '@rocket.chat/core-typings';
import { Settings } from '@rocket.chat/models';
import { serverFetch as fetch } from '@rocket.chat/server-fetch';
import * as z from 'zod';

import { CloudWorkspaceConnectionError } from '../../../../../lib/errors/CloudWorkspaceConnectionError';
import { CloudWorkspaceRegistrationError } from '../../../../../lib/errors/CloudWorkspaceRegistrationError';
import { notifyOnSettingChangedById } from '../../../../lib/server/lib/notifyListener';
import { settings } from '../../../../settings/server';
import type { WorkspaceRegistrationData } from '../buildRegistrationData';
import { buildWorkspaceRegistrationData } from '../buildRegistrationData';
import { CloudWorkspaceAccessTokenEmptyError, getWorkspaceAccessToken } from '../getWorkspaceAccessToken';
import { getWorkspaceLicense } from '../getWorkspaceLicense';
import { retrieveRegistrationStatus } from '../retrieveRegistrationStatus';
import { handleBannerOnWorkspaceSync, handleNpsOnWorkspaceSync } from './handleCommsSync';

/** @deprecated */
const fetchWorkspaceClientPayload = async ({
	token,
	workspaceRegistrationData,
}: {
	token: string;
	workspaceRegistrationData: WorkspaceRegistrationData<undefined>;
}): Promise<Cloud.WorkspaceSyncPayload | undefined> => {
	const workspaceRegistrationClientUri = settings.get<string>('Cloud_Workspace_Registration_Client_Uri');
	const response = await fetch(`${workspaceRegistrationClientUri}/client`, {
		method: 'POST',
		headers: {
			Authorization: `Bearer ${token}`,
		},
		body: workspaceRegistrationData,
		timeout: 5000,
	});

	if (!response.ok) {
		try {
			const { error } = await response.json();
			throw new CloudWorkspaceConnectionError(`Failed to connect to Rocket.Chat Cloud: ${error}`);
		} catch (error) {
			throw new CloudWorkspaceConnectionError(`Failed to connect to Rocket.Chat Cloud: ${response.statusText}`);
		}
	}

	const payload = await response.json();

	if (!payload) {
		return undefined;
	}

	const result = Cloud.WorkspaceSyncPayloadSchema.safeParse(payload);

	if (!result.success) {
		throw new CloudWorkspaceConnectionError('Invalid response from Rocket.Chat Cloud', {
			cause: z.prettifyError(result.error),
		});
	}

	return result.data;
};

/** @deprecated */
const consumeWorkspaceSyncPayload = async (result: Cloud.WorkspaceSyncPayload) => {
	if (result.publicKey) {
		(await Settings.updateValueById('Cloud_Workspace_PublicKey', result.publicKey)).modifiedCount &&
			void notifyOnSettingChangedById('Cloud_Workspace_PublicKey');
	}

	if (result.trial?.trialID) {
		(await Settings.updateValueById('Cloud_Workspace_Had_Trial', true)).modifiedCount &&
			void notifyOnSettingChangedById('Cloud_Workspace_Had_Trial');
	}

	// add banners
	if (result.banners) {
		await handleBannerOnWorkspaceSync(result.banners);
	}

	if (result.nps) {
		await handleNpsOnWorkspaceSync(result.nps);
	}
};

/** @deprecated */
export async function legacySyncWorkspace() {
	const { workspaceRegistered } = await retrieveRegistrationStatus();
	if (!workspaceRegistered) {
		throw new CloudWorkspaceRegistrationError('Workspace is not registered');
	}

	const token = await getWorkspaceAccessToken(true);
	if (!token) {
		throw new CloudWorkspaceAccessTokenEmptyError();
	}

	const workspaceRegistrationData = await buildWorkspaceRegistrationData(undefined);

	const payload = await fetchWorkspaceClientPayload({ token, workspaceRegistrationData });

	if (payload) {
		await consumeWorkspaceSyncPayload(payload);
	}

	await getWorkspaceLicense();

	return true;
}
