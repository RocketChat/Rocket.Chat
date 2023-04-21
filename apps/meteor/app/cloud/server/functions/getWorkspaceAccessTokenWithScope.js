import { getRedirectUri } from './getRedirectUri';
import { retrieveRegistrationStatus } from './retrieveRegistrationStatus';
import { removeWorkspaceRegistrationInfo } from './removeWorkspaceRegistrationInfo';
import { settings } from '../../../settings/server';
import { workspaceScopes } from '../oauthScopes';
import { SystemLogger } from '../../../../server/lib/logger/system';
import { fetch } from '../../../../server/lib/http/fetch';

export async function getWorkspaceAccessTokenWithScope(scope = '') {
	const { connectToCloud, workspaceRegistered } = await retrieveRegistrationStatus();

	const tokenResponse = { token: '', expiresAt: new Date() };

	if (!connectToCloud || !workspaceRegistered) {
		return tokenResponse;
	}

	const client_id = settings.get('Cloud_Workspace_Client_Id');
	if (!client_id) {
		return tokenResponse;
	}

	if (scope === '') {
		scope = workspaceScopes.join(' ');
	}

	const cloudUrl = settings.get('Cloud_Url');
	const client_secret = settings.get('Cloud_Workspace_Client_Secret');
	const redirectUri = getRedirectUri();

	let authTokenResult;
	try {
		const body = new URLSearchParams();
		body.append('client_id', client_id);
		body.append('client_secret', client_secret);
		body.append('scope', scope);
		body.append('grant_type', 'client_credentials');
		body.append('redirect_uri', redirectUri);

		const result = await fetch(`${cloudUrl}/api/oauth/token`, {
			headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
			method: 'POST',
			body,
		});
		authTokenResult = await result.json();
	} catch (err) {
		SystemLogger.error({
			msg: 'Failed to get Workspace AccessToken from Rocket.Chat Cloud',
			url: '/api/oauth/token',
			scope,
			...(err.response?.data && { cloudError: err.response.data }),
			err,
		});

		if (err.response?.data?.error === 'oauth_invalid_client_credentials') {
			SystemLogger.error('Server has been unregistered from cloud');
			removeWorkspaceRegistrationInfo();
		}

		return tokenResponse;
	}

	const expiresAt = new Date();
	expiresAt.setSeconds(expiresAt.getSeconds() + authTokenResult.expires_in);

	tokenResponse.expiresAt = expiresAt;
	tokenResponse.token = authTokenResult.access_token;

	return tokenResponse;
}
