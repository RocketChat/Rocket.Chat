import { Match, check } from 'meteor/check';
import { TwitterApi } from 'twitter-api-v2';
import _ from 'underscore';

import { registerAccessTokenService } from './oauth';

const whitelistedFields = ['id', 'name', 'description', 'profile_image_url', 'profile_image_url_https', 'lang', 'email'];

const getIdentity = async function (accessToken, appId, appSecret, accessTokenSecret) {
	const client = new TwitterApi({
		appKey: appId,
		appSecret,
		accessToken,
		accessSecret: accessTokenSecret,
	});
	try {
		return await client.v1.verifyCredentials({ include_email: true });
	} catch (err) {
		throw _.extend(new Error(`Failed to fetch identity from Twitter. ${err.message}`), {
			data: err.data ?? err.response,
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

	const fields = _.pick(identity, whitelistedFields);
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
