import { Users } from '@rocket.chat/models';
import { serverFetch as fetch } from '@rocket.chat/server-fetch';
import { Meteor } from 'meteor/meteor';

import { SystemLogger } from '../../../../server/lib/logger/system';
import { settings } from '../../../settings/server';
import { userScopes } from '../oauthScopes';
import { getRedirectUri } from './getRedirectUri';

export async function finishOAuthAuthorization(code: string, state: string) {
	if (settings.get<string>('Cloud_Workspace_Registration_State') !== state) {
		throw new Meteor.Error('error-invalid-state', 'Invalid state provided', {
			method: 'cloud:finishOAuthAuthorization',
		});
	}

	const clientId = settings.get<string>('Cloud_Workspace_Client_Id');
	const clientSecret = settings.get<string>('Cloud_Workspace_Client_Secret');

	const scope = userScopes.join(' ');

	let payload;
	try {
		const cloudUrl = settings.get<string>('Cloud_Url');
		const response = await fetch(`${cloudUrl}/api/oauth/token`, {
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

		if (!response.ok) {
			throw new Error((await response.json()).error);
		}

		payload = await response.json();
	} catch (err) {
		SystemLogger.error({
			msg: 'Failed to finish OAuth authorization with Rocket.Chat Cloud',
			url: '/api/oauth/token',
			err,
		});

		return false;
	}

	const expiresAt = new Date();
	expiresAt.setSeconds(expiresAt.getSeconds() + payload.expires_in);

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
					accessToken: payload.access_token,
					expiresAt,
					scope: payload.scope,
					tokenType: payload.token_type,
					refreshToken: payload.refresh_token,
				},
			},
		},
	);

	return true;
}
