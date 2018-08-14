import Twit from 'twit';
import _ from 'underscore';

const whitelistedFields = [
	'id',
	'name',
	'description',
	'profile_image_url',
	'profile_image_url_https',
	'lang',
	'email'
];

const getIdentity = function(accessToken, appId, appSecret, accessTokenSecret) {
	const Twitter = new Twit({
		consumer_key: appId,
		consumer_secret: appSecret,
		access_token: accessToken,
		access_token_secret: accessTokenSecret
	});
	const syncTwitter = Meteor.wrapAsync(Twitter.get, Twitter);
	try {
		return syncTwitter('account/verify_credentials.json?include_email=true');
	} catch (err) {
		throw _.extend(new Error(`Failed to fetch identity from Twwiter. ${ err.message }`),
			{response: err.response});
	}
};

RocketChat.registerAccessTokenService('twitter', function(options) {
	check(options, Match.ObjectIncluding({
		accessToken: String,
		appSecret: String,
		appId: String,
		accessTokenSecret: String,
		expiresIn: Match.Integer,
		identity: Match.Maybe(Object)
	}));

	const identity = options.identity || getIdentity(options.accessToken, options.appId, options.appSecret, options.accessTokenSecret);

	const serviceData = {
		accessToken: options.accessToken,
		expiresAt: (+new Date) + (1000 * parseInt(options.expiresIn, 10))
	};

	const fields = _.pick(identity, whitelistedFields);
	_.extend(serviceData, fields);

	return {
		serviceData,
		options: {
			profile: {
				name: identity.name
			}
		}
	};
});
