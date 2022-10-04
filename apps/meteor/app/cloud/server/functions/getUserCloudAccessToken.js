import { HTTP } from 'meteor/http';
import { Users } from '@rocket.chat/models';

import { getRedirectUri } from './getRedirectUri';
import { retrieveRegistrationStatus } from './retrieveRegistrationStatus';
import { unregisterWorkspace } from './unregisterWorkspace';
import { settings } from '../../../settings/server';
import { userScopes } from '../oauthScopes';
import { SystemLogger } from '../../../../server/lib/logger/system';

export async function getUserCloudAccessToken(userId, forceNew = false, scope = '', save = true) {
	const { connectToCloud, workspaceRegistered } = retrieveRegistrationStatus();

	if (!connectToCloud || !workspaceRegistered) {
		return '';
	}

	if (!userId) {
		return '';
	}

	const user = await Users.findOneById(userId, { projection: { 'services.cloud': 1 } });
	if (!user || !user.services || !user.services.cloud || !user.services.cloud.accessToken || !user.services.cloud.refreshToken) {
		return '';
	}

	const { accessToken, refreshToken } = user.services.cloud;

	const client_id = settings.get('Cloud_Workspace_Client_Id');
	if (!client_id) {
		return '';
	}

	const expires = user.services.cloud.expiresAt;
	const now = new Date();

	if (now < expires.value && !forceNew) {
		return accessToken;
	}

	const cloudUrl = settings.get('Cloud_Url');
	const client_secret = settings.get('Cloud_Workspace_Client_Secret');
	const redirectUri = getRedirectUri();

	if (scope === '') {
		scope = userScopes.join(' ');
	}

	let authTokenResult;
	try {
		authTokenResult = HTTP.post(`${cloudUrl}/api/oauth/token`, {
			headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
			params: {
				client_id,
				client_secret,
				refresh_token: refreshToken,
				scope,
				grant_type: 'refresh_token',
				redirect_uri: redirectUri,
			},
		});
	} catch (err) {
		SystemLogger.error({
			msg: 'Failed to get User AccessToken from Rocket.Chat Cloud',
			url: '/api/oauth/token',
			...(err.response?.data && { cloudError: err.response.data }),
			err,
		});

		if (err.response?.data?.error) {
			if (err.response.data.error === 'oauth_invalid_client_credentials') {
				SystemLogger.error('Server has been unregistered from cloud');
				unregisterWorkspace();
			}

			if (err.response.data.error === 'unauthorized') {
				await Users.unsetCloudServicesById(userId);
			}
		}

		return '';
	}

	if (save) {
		const expiresAt = new Date();
		expiresAt.setSeconds(expiresAt.getSeconds() + authTokenResult.data.expires_in);

		await Users.setCloudServicesById(user._id, {
			accessToken: authTokenResult.data.access_token,
			expiresAt,
		});
	}

	return authTokenResult.data.access_token;
}
