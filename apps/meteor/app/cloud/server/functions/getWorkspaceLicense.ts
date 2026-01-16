import { Cloud } from '@rocket.chat/core-typings';
import { Settings } from '@rocket.chat/models';
import { serverFetch as fetch } from '@rocket.chat/server-fetch';
import * as z from 'zod';

import { getWorkspaceAccessToken } from './getWorkspaceAccessToken';
import { CloudWorkspaceConnectionError } from '../../../../lib/errors/CloudWorkspaceConnectionError';
import { CloudWorkspaceLicenseError } from '../../../../lib/errors/CloudWorkspaceLicenseError';
import { callbacks } from '../../../../server/lib/callbacks';
import { SystemLogger } from '../../../../server/lib/logger/system';
import { settings } from '../../../settings/server';
import { LICENSE_VERSION } from '../license';

const fetchCloudWorkspaceLicensePayload = async ({ token }: { token: string }): Promise<Cloud.WorkspaceLicensePayload> => {
	const workspaceRegistrationClientUri = settings.get<string>('Cloud_Workspace_Registration_Client_Uri');
	const response = await fetch(`${workspaceRegistrationClientUri}/license`, {
		headers: {
			Authorization: `Bearer ${token}`,
		},
		params: {
			version: LICENSE_VERSION,
		},
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

	const result = Cloud.WorkspaceLicensePayloadSchema.safeParse(payload);

	if (!result.success) {
		throw new CloudWorkspaceLicenseError('WorkspaceLicensePayloadSchema failed type validation', {
			cause: z.prettifyError(result.error),
		});
	}

	return result.data;
};

export async function getWorkspaceLicense() {
	const currentLicense = await Settings.findOne('Cloud_Workspace_License');
	// it should never happen, since even if the license is not found, it will return an empty settings

	if (!currentLicense?._updatedAt) {
		throw new CloudWorkspaceLicenseError('Failed to retrieve current license');
	}

	try {
		const token = await getWorkspaceAccessToken();
		if (!token) {
			return;
		}

		const payload = await fetchCloudWorkspaceLicensePayload({ token });

		if (currentLicense.value && payload.updatedAt.getTime() <= currentLicense._updatedAt.getTime()) {
			return;
		}
		await callbacks.run('workspaceLicenseChanged', payload.license);

		return { updated: true, license: payload.license };
	} catch (err) {
		SystemLogger.error({
			msg: 'Failed to update license from Rocket.Chat Cloud',
			url: '/license',
			err,
		});
	}
}
