import { serverFetch as fetch } from '@rocket.chat/server-fetch';

import { SystemLogger } from '../../../../server/lib/logger/system';
import { settings } from '../../../settings/server';
import { getRedirectUri } from './getRedirectUri';
import { saveRegistrationData } from './saveRegistrationData';

export async function connectWorkspace(token: string) {
	// shouldn't get here due to checking this on the method
	// but this is just to double check
	if (!token) {
		return new Error('Invalid token; the registration token is required.');
	}

	const redirectUri = getRedirectUri();

	const regInfo = {
		email: settings.get('Organization_Email'),
		client_name: settings.get('Site_Name'),
		redirect_uris: [redirectUri],
	};

	const cloudUrl = settings.get('Cloud_Url');
	let result;
	try {
		const request = await fetch(`${cloudUrl}/api/oauth/clients`, {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${token}`,
			},
			body: regInfo,
		});

		if (!request.ok) {
			throw new Error((await request.json()).error);
		}

		result = await request.json();
	} catch (err: any) {
		SystemLogger.error({
			msg: 'Failed to Connect with Rocket.Chat Cloud',
			url: '/api/oauth/clients',
			err,
		});

		return false;
	}

	if (!result) {
		return false;
	}

	await saveRegistrationData(result);

	return true;
}
