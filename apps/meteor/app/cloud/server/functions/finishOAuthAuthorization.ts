import { Meteor } from 'meteor/meteor';
import { Users } from '@rocket.chat/models';
import { serverFetch as fetch } from '@rocket.chat/server-fetch';

import { getRedirectUri } from './getRedirectUri';
import { settings } from '../../../settings/server';
import { userScopes } from '../oauthScopes';
import { SystemLogger } from '../../../../server/lib/logger/system';

export async function finishOAuthAuthorization(code: string, state: string) {
	if (settings.get<string>('Cloud_Workspace_Registration_State') !== state) {
		throw new Meteor.Error('error-invalid-state', 'Invalid state provided', {
			method: 'cloud:finishOAuthAuthorization',
		});
	}

	const cloudUrl = settings.get<string>('Cloud_Url');
	const clientId = settings.get<string>('Cloud_Workspace_Client_Id');
	const clientSecret = settings.get<string>('Cloud_Workspace_Client_Secret');

	const scope = userScopes.join(' ');

	let result;
	try {
		const request = await fetch(`${cloudUrl}/api/oauth/token`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
			params: new URLSearchParams({
				client_id: clientId,
				client_secret: clientSecret,
				grant_type: 'authorization_code',
				scope,
				code,
				redirect_uri: getRedirectUri(),
			}),
		});

		if (!request.ok) {
			throw new Error((await request.json()).error);
		}

		result = await request.json();
	} catch (err) {
		SystemLogger.error({
			msg: 'Failed to finish OAuth authorization with Rocket.Chat Cloud',
			url: '/api/oauth/token',
			err,
		});

		return false;
	}

	const expiresAt = new Date();
	expiresAt.setSeconds(expiresAt.getSeconds() + result.expires_in);

	const uid = Meteor.userId();
	if (!uid) {
		throw new Meteor.Error('error-invalid-user', 'Invalid user', {
			method: 'cloud:finishOAuthAuthorization',
		});
	}

	await Users.updateOne(
		{ _id: uid },
		{
			$set: {
				'services.cloud': {
					accessToken: result.access_token,
					expiresAt,
					scope: result.scope,
					tokenType: result.token_type,
					refreshToken: result.refresh_token,
				},
			},
		},
	);

	return true;
}
