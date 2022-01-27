import { HTTP } from 'meteor/http';

import { getRedirectUri } from './getRedirectUri';
import { retrieveRegistrationStatus } from './retrieveRegistrationStatus';
import { Settings } from '../../../models';
import { settings } from '../../../settings';
import { saveRegistrationData } from './saveRegistrationData';
import { SystemLogger } from '../../../../server/lib/logger/system';

export function connectWorkspace(token) {
	const { connectToCloud } = retrieveRegistrationStatus();
	if (!connectToCloud) {
		Settings.updateValueById('Register_Server', true);
	}

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
		result = HTTP.post(`${cloudUrl}/api/oauth/clients`, {
			headers: {
				Authorization: `Bearer ${token}`,
			},
			data: regInfo,
		});
	} catch (e) {
		if (e.response && e.response.data && e.response.data.error) {
			SystemLogger.error(`Failed to register with Rocket.Chat Cloud.  Error: ${e.response.data.error}`);
		} else {
			SystemLogger.error(e);
		}

		return false;
	}

	const { data } = result;

	if (!data) {
		return false;
	}

	Promise.await(saveRegistrationData(data));

	return true;
}
