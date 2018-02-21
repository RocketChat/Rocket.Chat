import _ from 'underscore';
import { OAuth } from 'meteor/oauth';
const crypto = Npm.require('crypto');
const whitelisted = [
	'id',
	'email',
	'name',
	'first_name',
	'last_name',
	'link',
	'gender',
	'locale',
	'age_range'];

const FB_API_VERSION = 'v2.9';
const FB_URL = 'https://graph.facebook.com';

const getIdentity = function(accessToken, fields, secret) {
	const hmac = crypto.createHmac('sha256', OAuth.openSecret(secret));
	hmac.update(accessToken);

	try {
		return HTTP.get(`${ FB_URL }/${ FB_API_VERSION }/me`, {
			params: {
				access_token: accessToken,
				appsecret_proof: hmac.digest('hex'),
				fields: fields.join(',')
			}
		}).data;
	} catch (err) {
		throw _.extend(new Error(`Failed to fetch identity from Facebook. ${ err.message }`),
			{response: err.response});
	}
};

RocketChat.registerAccessTokenService('facebook', function(options) {
	check(options, Match.ObjectIncluding({
		accessToken: String,
		secret: String,
		expiresIn: Match.Integer
	}));

	const identity = options.identity || getIdentity(options.accessToken, whitelisted, options.secret);

	const serviceData = {
		accessToken: options.accessToken,
		expiresAt: (+new Date) + (1000 * parseInt(options.expiresIn, 10))
	};

	const fields = _.pick(identity, whitelisted);
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

