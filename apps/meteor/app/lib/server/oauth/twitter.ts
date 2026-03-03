import { Match, check } from 'meteor/check';
// @ts-expect-error - twit has no type definitions
import Twit from 'twit';

import { registerAccessTokenService } from './oauth';

const whitelistedFields = ['id', 'name', 'description', 'profile_image_url', 'profile_image_url_https', 'lang', 'email'];

const getIdentity = async function (
	accessToken: string,
	appId: string,
	appSecret: string,
	accessTokenSecret: string,
): Promise<Record<string, any>> {
	const Twitter = new Twit({
		consumer_key: appId,
		consumer_secret: appSecret,
		access_token: accessToken,
		access_token_secret: accessTokenSecret,
	});
	try {
		const result = await Twitter.get('account/verify_credentials.json?include_email=true');

		return result.data;
	} catch (err: any) {
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

	const serviceData: Record<string, any> = {
		accessToken: options.accessToken,
		expiresAt: +new Date() + 1000 * options.expiresIn,
	};

	const fields: Record<string, any> = {};
	for (const key of whitelistedFields) {
		if (identity[key]) {
			fields[key] = identity[key];
		}
	}
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
