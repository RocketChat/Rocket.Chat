import { serverFetch as fetch } from '@rocket.chat/server-fetch';

import { CloudWorkspaceConnectionError } from '../../../../lib/errors/CloudWorkspaceConnectionError';
import { SystemLogger } from '../../../../server/lib/logger/system';
import { settings } from '../../../settings/server';
import { getRedirectUri } from './getRedirectUri';
import { saveRegistrationData } from './saveRegistrationData';

const fetchRegistrationDataPayload = async ({
	token,
	body,
}: {
	token: string;
	body: {
		email: string;
		client_name: string;
		redirect_uris: string[];
	};
}) => {
	const cloudUrl = settings.get<string>('Cloud_Url');
	const response = await fetch(`${cloudUrl}/api/oauth/clients`, {
		method: 'POST',
		headers: {
			Authorization: `Bearer ${token}`,
		},
		body,
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

	return payload;
};

export async function connectWorkspace(token: string) {
	if (!token) {
		throw new CloudWorkspaceConnectionError('Invalid registration token');
	}

	try {
		const redirectUri = getRedirectUri();

		const body = {
			email: settings.get<string>('Organization_Email'),
			client_name: settings.get<string>('Site_Name'),
			redirect_uris: [redirectUri],
		};

		const payload = await fetchRegistrationDataPayload({ token, body });

		if (!payload) {
			return false;
		}

		await saveRegistrationData(payload);

		return true;
	} catch (err) {
		SystemLogger.error({
			msg: 'Failed to Connect with Rocket.Chat Cloud',
			url: '/api/oauth/clients',
			err,
		});

		return false;
	}
}
