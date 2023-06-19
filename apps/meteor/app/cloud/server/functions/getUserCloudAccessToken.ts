import { Users } from '@rocket.chat/models';
import type { IUser } from '@rocket.chat/core-typings';
import { serverFetch as fetch } from '@rocket.chat/server-fetch';

import { getRedirectUri } from './getRedirectUri';
import { retrieveRegistrationStatus } from './retrieveRegistrationStatus';
import { removeWorkspaceRegistrationInfo } from './removeWorkspaceRegistrationInfo';
import { userLoggedOut } from './userLoggedOut';
import { settings } from '../../../settings/server';
import { userScopes } from '../oauthScopes';
import { SystemLogger } from '../../../../server/lib/logger/system';

export async function getUserCloudAccessToken(userId: string, forceNew = false, scope = '', save = true) {
	const { connectToCloud, workspaceRegistered } = await retrieveRegistrationStatus();

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
		const request = await fetch(`${cloudUrl}/api/oauth/token`, {
			headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
			method: 'POST',
			params: new URLSearchParams({
				client_id: clientId,
				client_secret: clientSecret,
				refresh_token: refreshToken,
				scope,
				grant_type: 'refresh_token',
				redirect_uri: redirectUri,
			}),
		});

		if (!request.ok) {
			throw new Error((await request.json()).error);
		}

		authTokenResult = await request.json();
	} catch (err: any) {
		SystemLogger.error({
			msg: 'Failed to get User AccessToken from Rocket.Chat Cloud',
			url: '/api/oauth/token',
			err,
		});

		if (err) {
			if (err.message.includes('oauth_invalid_client_credentials')) {
				SystemLogger.error('Server has been unregistered from cloud');
				await removeWorkspaceRegistrationInfo();
			}

			if (err.message.includes('unauthorized')) {
				await userLoggedOut(userId);
			}
		}

		return '';
	}

	if (save) {
		const willExpireAt = new Date();
		willExpireAt.setSeconds(willExpireAt.getSeconds() + authTokenResult.expires_in);

		await Users.updateOne(
			{ _id: user._id },
			{
				$set: {
					'services.cloud': {
						accessToken: authTokenResult.access_token,
						expiresAt: willExpireAt,
					},
				},
			},
		);
	}

	return authTokenResult.access_token;
}
