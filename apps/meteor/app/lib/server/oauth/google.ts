import { serverFetch as fetch } from '@rocket.chat/server-fetch';
import { Match, check } from 'meteor/check';
import { Google } from 'meteor/google-oauth';

import { registerAccessTokenService } from './oauth';

async function getIdentity(accessToken: string): Promise<Record<string, any>> {
	try {
		const request = await fetch('https://www.googleapis.com/oauth2/v1/userinfo', {
			params: { access_token: accessToken },
		});

		if (!request.ok) {
			throw new Error(await request.text());
		}

		return request.json();
	} catch (err: any) {
		throw Object.assign(new Error(`Failed to fetch identity from Google. ${err.message}`), {
			response: err.message,
		});
	}
}

async function getScopes(accessToken: string): Promise<string[]> {
	try {
		const request = await fetch('https://www.googleapis.com/oauth2/v1/tokeninfo', {
			params: { access_token: accessToken },
		});

		if (!request.ok) {
			throw new Error(await request.text());
		}

		return (await request.json()).scope.split(' ');
	} catch (err: any) {
		throw Object.assign(new Error(`Failed to fetch tokeninfo from Google. ${err.message}`), {
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

	const serviceData: Record<string, any> = {
		accessToken: options.accessToken,
		idToken: options.idToken,
		expiresAt: +new Date() + 1000 * options.expiresIn,
		scope: options.scope || (await getScopes(options.accessToken)),
	};

	const fields: Record<string, any> = {};
	const { whitelistedFields } = Google as any;
	for (const key of whitelistedFields) {
		if (identity[key]) {
			fields[key] = identity[key];
		}
	}
	Object.assign(serviceData, fields);

	// only set the token in serviceData if it's there. this ensures
	// that we don't lose old ones (since we only get this on the first
	// log in attempt)
	if ((options as any).refreshToken) {
		serviceData.refreshToken = (options as any).refreshToken;
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
