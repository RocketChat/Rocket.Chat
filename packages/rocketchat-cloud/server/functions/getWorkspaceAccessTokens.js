import querystring from 'querystring';
import { HTTP } from 'meteor/http';

import { getRedirectUri } from './getRedirectUri';

export function getWorkspaceAccessToken() {
	if (!RocketChat.settings.get('Register_Server')) {
		return '';
	}

	const client_id = RocketChat.settings.get('Cloud_Workspace_Client_Id');
	if (!client_id) {
		return '';
	}

	const expires = RocketChat.models.Settings.findOneById('Cloud_Workspace_Access_Token_Expires_At');
	const now = new Date();

	if (now < expires.value) {
		return RocketChat.settings.get('Cloud_Workspace_Access_Token');
	}

	const cloudUrl = RocketChat.settings.get('Cloud_Url');
	const client_secret = RocketChat.settings.get('Cloud_Workspace_Client_Secret');
	const redirectUrl = getRedirectUri();

	const authTokenResult = HTTP.post(`${ cloudUrl }/api/oauth/token`, {
		data: {},
		query: querystring.stringify({
			client_id,
			client_secret,
			grant_type: 'client_credentials',
			redirect_uri: redirectUrl,
		}),
	});

	const expiresAt = new Date();
	expiresAt.setSeconds(expiresAt.getSeconds() + authTokenResult.data.expires_in);

	RocketChat.models.Settings.updateValueById('Cloud_Workspace_Access_Token', authTokenResult.data.access_token);
	RocketChat.models.Settings.updateValueById('Cloud_Workspace_Access_Token_Expires_At', expiresAt);
	RocketChat.models.Settings.updateValueById('Cloud_Workspace_Access_Token_Scope', authTokenResult.data.scope);

	console.log('refreshed client access token');

	return authTokenResult.data.access_token;
}
