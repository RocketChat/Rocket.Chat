import querystring from 'querystring';

import { Meteor } from 'meteor/meteor';
import { HTTP } from 'meteor/http';

import { getRedirectUri } from './getRedirectUri';

export function finishOAuthAuthorization(code, state) {
	if (RocketChat.settings.get('Cloud_Workspace_Registration_State') !== state) {
		throw new Meteor.Error('error-invalid-state', 'Invalid state provided', { method: 'cloud:finishOAuthAuthorization' });
	}

	const cloudUrl = RocketChat.settings.get('Cloud_Url');
	const clientId = RocketChat.settings.get('Cloud_Workspace_Client_Id');
	const clientSecret = RocketChat.settings.get('Cloud_Workspace_Client_Secret');

	let result;
	try {
		result = HTTP.post(`${ cloudUrl }/api/oauth/token`, {
			data: {},
			query: querystring.stringify({
				client_id: clientId,
				client_secret: clientSecret,
				grant_type: 'authorization_code',
				code,
				redirect_uri: getRedirectUri(),
			}),
		});
	} catch (e) {
		return false;
	}

	const expiresAt = new Date();
	expiresAt.setSeconds(expiresAt.getSeconds() + result.data.expires_in);

	RocketChat.models.Settings.updateValueById('Cloud_Workspace_Account_Associated', true);
	RocketChat.models.Users.update({ _id: Meteor.userId() }, {
		$set: {
			'services.cloud': {
				accessToken: result.data.access_token,
				expiresAt,
				scope: result.data.scope,
				tokenType: result.data.token_type,
				refreshToken: result.data.refresh_token,
			},
		},
	});

	return true;
}
