import querystring from 'querystring';
import { HTTP } from 'meteor/http';

import { getRedirectUri } from './getRedirectUri';
import { retrieveRegistrationStatus } from './retrieveRegistrationStatus';

export function connectWorkspace(token) {
	const { registeredWithWizard } = retrieveRegistrationStatus();
	if (!registeredWithWizard) {
		return false;
	}

	const redirectUri = getRedirectUri();

	const regInfo = {
		email: RocketChat.settings.get('Organization_Email'),
		client_name: RocketChat.settings.get('Site_Name'),
		redirect_uris: [redirectUri],
	};

	const cloudUrl = RocketChat.settings.get('Cloud_Url');
	let result;
	try {
		result = HTTP.post(`${ cloudUrl }/api/oauth/clients`, {
			headers: {
				Authorization: `Bearer ${ token }`,
			},
			data: regInfo,
		});
	} catch (e) {
		return false;
	}

	const { data } = result;

	if (!data) {
		return false;
	}

	RocketChat.models.Settings.updateValueById('Cloud_Workspace_Id', data.workspaceId);
	RocketChat.models.Settings.updateValueById('Cloud_Workspace_Name', data.client_name);
	RocketChat.models.Settings.updateValueById('Cloud_Workspace_Client_Id', data.client_id);
	RocketChat.models.Settings.updateValueById('Cloud_Workspace_Client_Secret', data.client_secret);
	RocketChat.models.Settings.updateValueById('Cloud_Workspace_Client_Secret_Expires_At', data.client_secret_expires_at);
	RocketChat.models.Settings.updateValueById('Cloud_Workspace_Registration_Client_Uri', data.registration_client_uri);

	// Now that we have the client id and secret, let's get the access token
	let authTokenResult;
	try {
		authTokenResult = HTTP.post(`${ cloudUrl }/api/oauth/token`, {
			data: {},
			query: querystring.stringify({
				client_id: data.client_id,
				client_secret: data.client_secret,
				grant_type: 'client_credentials',
				redirect_uri: redirectUri,
			}),
		});
	} catch (e) {
		return false;
	}

	const expiresAt = new Date();
	expiresAt.setSeconds(expiresAt.getSeconds() + authTokenResult.data.expires_in);

	RocketChat.models.Settings.updateValueById('Cloud_Workspace_Access_Token', authTokenResult.data.access_token);
	RocketChat.models.Settings.updateValueById('Cloud_Workspace_Access_Token_Expires_At', expiresAt);

	return true;
}
