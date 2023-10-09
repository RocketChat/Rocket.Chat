import type { Cloud, Serialized } from '@rocket.chat/core-typings';
import { serverFetch as fetch } from '@rocket.chat/server-fetch';
import { v, compile } from 'suretype';

import { callbacks } from '../../../../../lib/callbacks';
import { CloudWorkspaceAccessError } from '../../../../../lib/errors/CloudWorkspaceAccessError';
import { CloudWorkspaceConnectionError } from '../../../../../lib/errors/CloudWorkspaceConnectionError';
import { CloudWorkspaceRegistrationError } from '../../../../../lib/errors/CloudWorkspaceRegistrationError';
import { SystemLogger } from '../../../../../server/lib/logger/system';
import { settings } from '../../../../settings/server';
import { buildWorkspaceRegistrationData } from '../buildRegistrationData';
import { getWorkspaceAccessToken } from '../getWorkspaceAccessToken';
import { retrieveRegistrationStatus } from '../retrieveRegistrationStatus';
import { legacySyncWorkspace } from './legacySyncWorkspace';

const workspaceSyncPayloadSchema = v.object({
	workspaceId: v.string().required(),
	publicKey: v.string(),
	license: v.string().required(),
});

const assertWorkspaceSyncPayload = compile(workspaceSyncPayloadSchema);

const fetchWorkspaceSyncPayload = async ({
	token,
	data,
}: {
	token: string;
	data: Cloud.WorkspaceSyncRequestPayload;
}): Promise<Serialized<Cloud.WorkspaceSyncResponse>> => {
	const workspaceRegistrationClientUri = settings.get<string>('Cloud_Workspace_Registration_Client_Uri');
	const response = await fetch(`${workspaceRegistrationClientUri}/sync`, {
		method: 'POST',
		headers: {
			Authorization: `Bearer ${token}`,
		},
		body: data,
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

	assertWorkspaceSyncPayload(payload);

	return payload;
};

export async function syncCloudData() {
	try {
		const { workspaceRegistered } = await retrieveRegistrationStatus();
		if (!workspaceRegistered) {
			throw new CloudWorkspaceRegistrationError('Workspace is not registered');
		}

		const token = await getWorkspaceAccessToken(true);
		if (!token) {
			throw new CloudWorkspaceAccessError('Workspace does not have a valid access token');
		}

		const workspaceRegistrationData = await buildWorkspaceRegistrationData(undefined);

		const { license } = await fetchWorkspaceSyncPayload({
			token,
			data: workspaceRegistrationData,
		});

		await callbacks.run('workspaceLicenseChanged', license);

		return true;
	} catch (err) {
		SystemLogger.error({
			msg: 'Failed to sync with Rocket.Chat Cloud',
			url: '/sync',
			err,
		});
	}

	await legacySyncWorkspace();
}
