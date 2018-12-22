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

	const result = HTTP.post(`${ cloudUrl }/api/oauth/token`, {
		data: {},
		query: querystring.stringify({
			client_id: clientId,
			client_secret: clientSecret,
			grant_type: 'authorization_code',
			code,
			redirect_uri: getRedirectUri(),
		}),
	});

	// TODO: determine how to handle this

	return result;
}
