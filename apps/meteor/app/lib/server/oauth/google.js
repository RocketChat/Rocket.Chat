import { Match, check } from 'meteor/check';
import _ from 'underscore';
import { HTTP } from 'meteor/http';
import { Google } from 'meteor/google-oauth';

import { registerAccessTokenService } from './oauth';

function getIdentity(accessToken) {
	try {
		return HTTP.get('https://www.googleapis.com/oauth2/v1/userinfo', {
			params: { access_token: accessToken },
		}).data;
	} catch (err) {
		throw _.extend(new Error(`Failed to fetch identity from Google. ${err.message}`), {
			response: err.response,
		});
	}
}

function getScopes(accessToken) {
	try {
		return HTTP.get('https://www.googleapis.com/oauth2/v1/tokeninfo', {
			params: { access_token: accessToken },
		}).data.scope.split(' ');
	} catch (err) {
		throw _.extend(new Error(`Failed to fetch tokeninfo from Google. ${err.message}`), {
			response: err.response,
		});
	}
}

registerAccessTokenService('google', function (options) {
	check(
		options,
		Match.ObjectIncluding({
			accessToken: String,
			idToken: String,
			expiresIn: Match.Integer,
			scope: Match.Maybe(String),
			identity: Match.Maybe(Object),
		}),
	);

	const identity = getIdentity(options.accessToken);

	const serviceData = {
		accessToken: options.accessToken,
		idToken: options.idToken,
		expiresAt: +new Date() + 1000 * parseInt(options.expiresIn, 10),
		scope: options.scopes || getScopes(options.accessToken),
	};

	const fields = _.pick(identity, Google.whitelistedFields);
	_.extend(serviceData, fields);

	// only set the token in serviceData if it's there. this ensures
	// that we don't lose old ones (since we only get this on the first
	// log in attempt)
	if (options.refreshToken) {
		serviceData.refreshToken = options.refreshToken;
	}

	return {
		serviceData,
		options: {
			profile: {
				name: identity.name,
			},
		},
	};
});
