import { Match, check } from 'meteor/check';
import Twit from 'twit';

import { registerAccessTokenService } from './oauth';

const whitelistedFields = ['id', 'name', 'description', 'profile_image_url', 'profile_image_url_https', 'lang', 'email'];

const getIdentity = async function (accessToken, appId, appSecret, accessTokenSecret) {
	const Twitter = new Twit({
		consumer_key: appId,
		consumer_secret: appSecret,
		access_token: accessToken,
		access_token_secret: accessTokenSecret,
	});
	try {
		const result = await Twitter.get('account/verify_credentials.json?include_email=true');

		return result.data;
	} catch (err) {
		throw Object.assign(new Error(`Failed to fetch identity from Twwiter. ${err.message}`), {
			response: err.response,
		});
	}
};

registerAccessTokenService('twitter', async (options) => {
	check(
		options,
		Match.ObjectIncluding({
			accessToken: String,
			appSecret: String,
			appId: String,
			accessTokenSecret: String,
			expiresIn: Match.Integer,
		}),
	);

	const identity = await getIdentity(options.accessToken, options.appId, options.appSecret, options.accessTokenSecret);

	const serviceData = {
		accessToken: options.accessToken,
		expiresAt: +new Date() + 1000 * parseInt(options.expiresIn, 10),
	};

	const fields = Object.fromEntries(Object.entries(identity).filter(([prop]) => whitelistedFields.includes(prop)));
	Object.assign(serviceData, fields);

	return {
		serviceData,
		options: {
			profile: {
				name: identity.name,
			},
		},
	};
});
