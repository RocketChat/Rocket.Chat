import { serverFetch as fetch } from '@rocket.chat/server-fetch';

import { SystemLogger } from '../../../../server/lib/logger/system';
import { settings } from '../../../settings/server';
import { workspaceScopes } from '../oauthScopes';
import { getRedirectUri } from './getRedirectUri';
import { removeWorkspaceRegistrationInfo } from './removeWorkspaceRegistrationInfo';
import { retrieveRegistrationStatus } from './retrieveRegistrationStatus';

export async function getWorkspaceAccessTokenWithScope(scope = '') {
	const { workspaceRegistered } = await retrieveRegistrationStatus();

	const tokenResponse = { token: '', expiresAt: new Date() };

	if (!workspaceRegistered) {
		return tokenResponse;
	}

	// eslint-disable-next-line @typescript-eslint/naming-convention
	const client_id = settings.get<string>('Cloud_Workspace_Client_Id');
	if (!client_id) {
		return tokenResponse;
	}

	if (scope === '') {
		scope = workspaceScopes.join(' ');
	}

	const cloudUrl = settings.get<string>('Cloud_Url');
	// eslint-disable-next-line @typescript-eslint/naming-convention
	const client_secret = settings.get<string>('Cloud_Workspace_Client_Secret');
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
	} catch (err: any) {
		SystemLogger.error({
			msg: 'Failed to get Workspace AccessToken from Rocket.Chat Cloud',
			url: '/api/oauth/token',
			scope,
			...(err.response?.data && { cloudError: err.response.data }),
			err,
		});

		if (err.response?.data?.error === 'oauth_invalid_client_credentials') {
			SystemLogger.error('Server has been unregistered from cloud');
			void removeWorkspaceRegistrationInfo();
		}

		return tokenResponse;
	}

	const expiresAt = new Date();
	expiresAt.setSeconds(expiresAt.getSeconds() + authTokenResult.expires_in);

	tokenResponse.expiresAt = expiresAt;
	tokenResponse.token = authTokenResult.access_token;

	return tokenResponse;
}
