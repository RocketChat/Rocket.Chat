import querystring from 'querystring';

import { HTTP } from 'meteor/http';
import { settings } from '../../../settings';
import { Settings } from '../../../models';

import { getRedirectUri } from './getRedirectUri';
import { retrieveRegistrationStatus } from './retrieveRegistrationStatus';
import { unregisterWorkspace } from './unregisterWorkspace';

export function getWorkspaceAccessToken() {
	const { connectToCloud, workspaceRegistered } = retrieveRegistrationStatus();

	if (!connectToCloud || !workspaceRegistered) {
		return '';
	}

	const client_id = settings.get('Cloud_Workspace_Client_Id');
	if (!client_id) {
		return '';
	}

	const expires = Settings.findOneById('Cloud_Workspace_Access_Token_Expires_At');
	const now = new Date();

	if (now < expires.value) {
		return settings.get('Cloud_Workspace_Access_Token');
	}

	const cloudUrl = settings.get('Cloud_Url');
	const client_secret = settings.get('Cloud_Workspace_Client_Secret');
	const redirectUri = getRedirectUri();

	let authTokenResult;
	try {
		authTokenResult = HTTP.post(`${ cloudUrl }/api/oauth/token`, {
			data: {},
			query: querystring.stringify({
				client_id,
				client_secret,
				grant_type: 'client_credentials',
				redirect_uri: redirectUri,
			}),
		});
	} catch (e) {
		if (e.response && e.response.data && e.response.data.errorCode === 'oauth_invalid_client_credentials') {
			console.error('Server has been unregistered from cloud');
			unregisterWorkspace();
		}

		return '';
	}

	const expiresAt = new Date();
	expiresAt.setSeconds(expiresAt.getSeconds() + authTokenResult.data.expires_in);

	Settings.updateValueById('Cloud_Workspace_Access_Token', authTokenResult.data.access_token);
	Settings.updateValueById('Cloud_Workspace_Access_Token_Expires_At', expiresAt);

	return authTokenResult.data.access_token;
}
