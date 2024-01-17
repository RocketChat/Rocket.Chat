import crypto from 'crypto';

import { serverFetch as fetch } from '@rocket.chat/server-fetch';
import { Match, check } from 'meteor/check';
import { OAuth } from 'meteor/oauth';
import _ from 'underscore';

import { registerAccessTokenService } from './oauth';

const whitelisted = ['id', 'email', 'name', 'first_name', 'last_name', 'link', 'gender', 'locale', 'age_range'];

const FB_API_VERSION = 'v2.9';
const FB_URL = 'https://graph.facebook.com';

const getIdentity = async function (accessToken, fields, secret) {
	const hmac = crypto.createHmac('sha256', OAuth.openSecret(secret));
	hmac.update(accessToken);

	try {
		const request = await fetch(`${FB_URL}/${FB_API_VERSION}/me`, {
			params: {
				access_token: accessToken,
				appsecret_proof: hmac.digest('hex'),
				fields: fields.join(','),
			},
		});

		if (!request.ok) {
			throw new Error(await request.text());
		}

		return request.json();
	} catch (err) {
		throw _.extend(new Error(`Failed to fetch identity from Facebook. ${err.message}`), {
			response: err.message,
		});
	}
};

registerAccessTokenService('facebook', async (options) => {
	check(
		options,
		Match.ObjectIncluding({
			accessToken: String,
			secret: String,
			expiresIn: Match.Integer,
		}),
	);

	const identity = await getIdentity(options.accessToken, whitelisted, options.secret);

	const serviceData = {
		accessToken: options.accessToken,
		expiresAt: +new Date() + 1000 * parseInt(options.expiresIn, 10),
	};

	const fields = _.pick(identity, whitelisted);
	_.extend(serviceData, fields);

	return {
		serviceData,
		options: {
			profile: {
				name: identity.name,
			},
		},
	};
});
