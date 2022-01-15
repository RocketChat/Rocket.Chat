import { HTTP } from 'meteor/http';

import { getRedirectUri } from './getRedirectUri';
import { retrieveRegistrationStatus } from './retrieveRegistrationStatus';
import { unregisterWorkspace } from './unregisterWorkspace';
import { userLoggedOut } from './userLoggedOut';
import { Users } from '../../../models';
import { settings } from '../../../settings';
import { userScopes } from '../oauthScopes';
import { SystemLogger } from '../../../../server/lib/logger/system';

export function getUserCloudAccessToken(userId, forceNew = false, scope = '', save = true) {
	const { connectToCloud, workspaceRegistered } = retrieveRegistrationStatus();

	if (!connectToCloud || !workspaceRegistered) {
		return '';
	}

	if (!userId) {
		return '';
	}

	const user = Users.findOneById(userId);

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
	} catch (e) {
		if (e.response && e.response.data && e.response.data.error) {
			SystemLogger.error(`Failed to get User AccessToken from Rocket.Chat Cloud.  Error: ${e.response.data.error}`);

			if (e.response.data.error === 'oauth_invalid_client_credentials') {
				SystemLogger.error('Server has been unregistered from cloud');
				unregisterWorkspace();
			}

			if (e.response.data.error === 'unauthorized') {
				userLoggedOut(userId);
			}
		} else {
			SystemLogger.error(e);
		}

		return '';
	}

	if (save) {
		const expiresAt = new Date();
		expiresAt.setSeconds(expiresAt.getSeconds() + authTokenResult.data.expires_in);

		Users.update(user._id, {
			$set: {
				services: {
					cloud: {
						accessToken: authTokenResult.data.access_token,
						expiresAt,
					},
				},
			},
		});
	}

	return authTokenResult.data.access_token;
}
