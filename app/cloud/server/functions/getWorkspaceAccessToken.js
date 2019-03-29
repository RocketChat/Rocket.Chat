import querystring from 'querystring';

import { HTTP } from 'meteor/http';
import { settings } from '../../../settings';
import { Settings } from '../../../models';

import { getRedirectUri } from './getRedirectUri';

export function getWorkspaceAccessToken(forceNew = false, scope = '', save = true) {
	if (!settings.get('Register_Server')) {
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

	let authTokenResult;
	try {
		authTokenResult = HTTP.post(`${ cloudUrl }/api/oauth/token`, {
			data: {},
			query: querystring.stringify({
				client_id,
				client_secret,
				scope,
				grant_type: 'client_credentials',
				redirect_uri: redirectUri,
			}),
		});
	} catch (e) {
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
