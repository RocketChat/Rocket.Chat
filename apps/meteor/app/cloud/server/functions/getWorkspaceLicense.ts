import type { Cloud, Serialized } from '@rocket.chat/core-typings';
import { Settings } from '@rocket.chat/models';
import { serverFetch as fetch } from '@rocket.chat/server-fetch';
import { v, compile } from 'suretype';

import { callbacks } from '../../../../lib/callbacks';
import { CloudWorkspaceConnectionError } from '../../../../lib/errors/CloudWorkspaceConnectionError';
import { CloudWorkspaceLicenseError } from '../../../../lib/errors/CloudWorkspaceLicenseError';
import { SystemLogger } from '../../../../server/lib/logger/system';
import { settings } from '../../../settings/server';
import { LICENSE_VERSION } from '../license';
import { getWorkspaceAccessToken } from './getWorkspaceAccessToken';

const workspaceLicensePayloadSchema = v.object({
	version: v.number().required(),
	address: v.string().required(),
	license: v.string().required(),
	updatedAt: v.string().format('date-time').required(),
	modules: v.string().required(),
	expireAt: v.string().format('date-time').required(),
});

const assertWorkspaceLicensePayload = compile(workspaceLicensePayloadSchema);

const fetchCloudWorkspaceLicensePayload = async ({ token }: { token: string }): Promise<Serialized<Cloud.WorkspaceLicensePayload>> => {
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

	assertWorkspaceLicensePayload(payload);

	return payload;
};

export async function getWorkspaceLicense(): Promise<{ updated: boolean; license: string }> {
	const currentLicense = await Settings.findOne('Cloud_Workspace_License');

	const fromCurrentLicense = async () => {
		const license = currentLicense?.value as string | undefined;
		if (license) {
			callbacks.run('workspaceLicenseChanged', license);
		}

		return { updated: false, license: license ?? '' };
	};

	try {
		const token = await getWorkspaceAccessToken();
		if (!token) {
			return fromCurrentLicense();
		}

		if (!currentLicense?._updatedAt) {
			throw new CloudWorkspaceLicenseError('Failed to retrieve current license');
		}

		const payload = await fetchCloudWorkspaceLicensePayload({ token });

		if (Date.parse(payload.updatedAt) <= currentLicense._updatedAt.getTime()) {
			return fromCurrentLicense();
		}

		await Settings.updateValueById('Cloud_Workspace_License', payload.license);

		await callbacks.run('workspaceLicenseChanged', payload.license);

		return { updated: true, license: payload.license };
	} catch (err) {
		SystemLogger.error({
			msg: 'Failed to update license from Rocket.Chat Cloud',
			url: '/license',
			err,
		});

		return fromCurrentLicense();
	}
}
