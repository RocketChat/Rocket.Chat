import { HTTP } from 'meteor/http';
import { settings } from '../../../settings';
import { Settings } from '../../../models';

import { getRedirectUri } from './getRedirectUri';
import { retrieveRegistrationStatus } from './retrieveRegistrationStatus';
import { getWorkspaceAccessToken } from './getWorkspaceAccessToken';

export function connectWorkspace(token) {
	const { connectToCloud } = retrieveRegistrationStatus();
	if (!connectToCloud) {
		Settings.updateValueById('Register_Server', true);
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
		result = HTTP.post(`${ cloudUrl }/api/oauth/clients`, {
			headers: {
				Authorization: `Bearer ${ token }`,
			},
			data: regInfo,
		});
	} catch (e) {
		if (e.response && e.response.data && e.response.data.error) {
			console.error(`Failed to register with Rocket.Chat Cloud.  Error: ${ e.response.data.error }`);
		} else {
			console.error(e);
		}

		return false;
	}

	const { data } = result;

	if (!data) {
		return false;
	}

	Settings.updateValueById('Cloud_Workspace_Id', data.workspaceId);
	Settings.updateValueById('Cloud_Workspace_Name', data.client_name);
	Settings.updateValueById('Cloud_Workspace_Client_Id', data.client_id);
	Settings.updateValueById('Cloud_Workspace_Client_Secret', data.client_secret);
	Settings.updateValueById('Cloud_Workspace_Client_Secret_Expires_At', data.client_secret_expires_at);
	Settings.updateValueById('Cloud_Workspace_Registration_Client_Uri', data.registration_client_uri);

	// Now that we have the client id and secret, let's get the access token
	const accessToken = getWorkspaceAccessToken(true);
	if (!accessToken) {
		return false;
	}

	return true;
}
