import { serverFetch as fetch } from '@rocket.chat/server-fetch';
import { Match, check } from 'meteor/check';
import { Google } from 'meteor/google-oauth';
import _ from 'underscore';

import { registerAccessTokenService } from './oauth';

async function getIdentity(accessToken) {
	try {
		const request = await fetch('https://www.googleapis.com/oauth2/v1/userinfo', {
			params: { access_token: accessToken },
		});

		if (!request.ok) {
			throw new Error(await request.text());
		}

		return request.json();
	} catch (err) {
		throw _.extend(new Error(`Failed to fetch identity from Google. ${err.message}`), {
			response: err.message,
		});
	}
}

async function getScopes(accessToken) {
	try {
		const request = await fetch('https://www.googleapis.com/oauth2/v1/tokeninfo', {
			params: { access_token: accessToken },
		});

		if (!request.ok) {
			throw new Error(await request.text());
		}

		return (await request.json()).scope.split(' ');
	} catch (err) {
		throw _.extend(new Error(`Failed to fetch tokeninfo from Google. ${err.message}`), {
			response: err.message,
		});
	}
}

registerAccessTokenService('google', async (options) => {
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

	const identity = await getIdentity(options.accessToken);

	const serviceData = {
		accessToken: options.accessToken,
		idToken: options.idToken,
		expiresAt: +new Date() + 1000 * parseInt(options.expiresIn, 10),
		scope: options.scopes || (await getScopes(options.accessToken)),
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
