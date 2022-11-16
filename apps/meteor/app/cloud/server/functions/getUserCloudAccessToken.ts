import { HTTP } from 'meteor/http';
import { Users } from '@rocket.chat/models';
import type { IUser } from '@rocket.chat/core-typings';

import { getRedirectUri } from './getRedirectUri';
import { retrieveRegistrationStatus } from './retrieveRegistrationStatus';
import { unregisterWorkspace } from './unregisterWorkspace';
import { userLoggedOut } from './userLoggedOut';
import { settings } from '../../../settings/server';
import { userScopes } from '../oauthScopes';
import { SystemLogger } from '../../../../server/lib/logger/system';

export async function getUserCloudAccessToken(userId: string, forceNew = false, scope = '', save = true) {
	const { connectToCloud, workspaceRegistered } = retrieveRegistrationStatus();

	if (!connectToCloud || !workspaceRegistered) {
		return '';
	}

	if (!userId) {
		return '';
	}

	const user = await Users.findOneById<Pick<IUser, '_id' | 'services'>>(userId, { projection: { 'services.cloud': 1 } });
	if (!user?.services?.cloud?.accessToken || !user?.services?.cloud?.refreshToken) {
		return '';
	}

	const { accessToken, refreshToken, expiresAt } = user.services.cloud;

	const clientId = settings.get<string>('Cloud_Workspace_Client_Id');
	if (!clientId) {
		return '';
	}

	const clientSecret = settings.get<string>('Cloud_Workspace_Client_Secret');
	if (!clientSecret) {
		return '';
	}

	const now = new Date();

	if (now < expiresAt && !forceNew) {
		return accessToken;
	}

	const cloudUrl = settings.get('Cloud_Url');
	const redirectUri = getRedirectUri();

	if (scope === '') {
		scope = userScopes.join(' ');
	}

	let authTokenResult;
	try {
		authTokenResult = HTTP.post(`${cloudUrl}/api/oauth/token`, {
			headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
			params: {
				client_id: clientId,
				client_secret: clientSecret,
				refresh_token: refreshToken,
				scope,
				grant_type: 'refresh_token',
				redirect_uri: redirectUri,
			},
		});
	} catch (err: any) {
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
				userLoggedOut(userId);
			}
		}

		return '';
	}

	if (save) {
		const willExpireAt = new Date();
		willExpireAt.setSeconds(willExpireAt.getSeconds() + authTokenResult.data.expires_in);

		await Users.updateOne(
			{ _id: user._id },
			{
				$set: {
					'services.cloud': {
						accessToken: authTokenResult.data.access_token,
						expiresAt: willExpireAt,
					},
				},
			},
		);
	}

	return authTokenResult.data.access_token;
}
