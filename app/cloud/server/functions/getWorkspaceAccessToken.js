import { HTTP } from 'meteor/http';
import { settings } from '../../../settings';
import { Settings } from '../../../models';

import { getRedirectUri } from './getRedirectUri';
import { retrieveRegistrationStatus } from './retrieveRegistrationStatus';
import { unregisterWorkspace } from './unregisterWorkspace';
import { workspaceScopes } from '../oauthScopes';

export function getWorkspaceAccessToken(forceNew = false, scope = '', save = true) {
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

	if (now < expires.value && !forceNew) {
		return settings.get('Cloud_Workspace_Access_Token');
	}

	const cloudUrl = settings.get('Cloud_Url');
	const client_secret = settings.get('Cloud_Workspace_Client_Secret');
	const redirectUri = getRedirectUri();

	if (scope === '') {
		scope = workspaceScopes.join(' ');
	}

	let authTokenResult;
	try {
		authTokenResult = HTTP.post(`${ cloudUrl }/api/oauth/token`, {
			headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
			params: {
				client_id,
				client_secret,
				scope,
				grant_type: 'client_credentials',
				redirect_uri: redirectUri,
			},
		});
	} catch (e) {
		if (e.response && e.response.data && e.response.data.error) {
			console.error(`Failed to get AccessToken from Rocket.Chat Cloud.  Error: ${ e.response.data.error }`);

			if (e.response.data.error === 'oauth_invalid_client_credentials') {
				console.error('Server has been unregistered from cloud');
				unregisterWorkspace();
			}
		}

		return '';
	}

	if (save) {
		const expiresAt = new Date();
		expiresAt.setSeconds(expiresAt.getSeconds() + authTokenResult.data.expires_in);

		Settings.updateValueById('Cloud_Workspace_Access_Token', authTokenResult.data.access_token);
		Settings.updateValueById('Cloud_Workspace_Access_Token_Expires_At', expiresAt);
	}

	return authTokenResult.data.access_token;
}
