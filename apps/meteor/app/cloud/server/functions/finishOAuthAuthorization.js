import { Meteor } from 'meteor/meteor';
import { HTTP } from 'meteor/http';

import { getRedirectUri } from './getRedirectUri';
import { settings } from '../../../settings/server';
import { Users } from '../../../models/server';
import { userScopes } from '../oauthScopes';
import { SystemLogger } from '../../../../server/lib/logger/system';

export function finishOAuthAuthorization(code, state) {
	if (settings.get('Cloud_Workspace_Registration_State') !== state) {
		throw new Meteor.Error('error-invalid-state', 'Invalid state provided', {
			method: 'cloud:finishOAuthAuthorization',
		});
	}

	const cloudUrl = settings.get('Cloud_Url');
	const clientId = settings.get('Cloud_Workspace_Client_Id');
	const clientSecret = settings.get('Cloud_Workspace_Client_Secret');

	const scope = userScopes.join(' ');

	let result;
	try {
		result = HTTP.post(`${cloudUrl}/api/oauth/token`, {
			headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
			params: {
				client_id: clientId,
				client_secret: clientSecret,
				grant_type: 'authorization_code',
				scope,
				code,
				redirect_uri: getRedirectUri(),
			},
		});
	} catch (err) {
		SystemLogger.error({
			msg: 'Failed to finish OAuth authorization with Rocket.Chat Cloud',
			url: '/api/oauth/token',
			...(err.response?.data && { cloudError: err.response.data }),
			err,
		});

		return false;
	}

	const expiresAt = new Date();
	expiresAt.setSeconds(expiresAt.getSeconds() + result.data.expires_in);

	Users.update(
		{ _id: Meteor.userId() },
		{
			$set: {
				'services.cloud': {
					accessToken: result.data.access_token,
					expiresAt,
					scope: result.data.scope,
					tokenType: result.data.token_type,
					refreshToken: result.data.refresh_token,
				},
			},
		},
	);

	return true;
}
