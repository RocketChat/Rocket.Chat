import { Match, check } from 'meteor/check';
import _ from 'underscore';
import jwt from 'jsonwebtoken';

// This is an example certificate. Replace it with your own keycloak certificate!
const cert = '-----BEGIN PUBLIC KEY-----\n' +
	'MIIBITANBgkqhkiG9w0BAQEFAAOCAQ4AMIIBCQKCAQBYlFeiEGi5qK4how0xa0Ys\n' +
	'aozPwHanRarzTp8VsBuT7xNFc6Do0t5yHVqfhX8VQTFQNHB1p0G7wQWuJYfm8u79\n' +
	'llv9GiUq1gmS3RESIDt/8HZmXatYIi0NhPpzVBLrvROhykyix15mLkWodzfvlX/M\n' +
	'Zltss18auTx8Yx2iUZfzmXKjfFzyzQEnhtv+1Xa1bjn8e2GJyXXtMiBC9HBOnVoP\n' +
	'U8XJJ7vAL4ZiH06m8d9uTL41YDk9eAr5tJsobFdEF48nA42C+0aj+bDypzBz6VrK\n' +
	'duA2+EqbG0rWtca4W7KArXMJPv8D6FOZqvf6F9RP0TuUtrJA7ccwopp+e470nz+7\n' +
	'AgMBAAE=\n' +
	'-----END PUBLIC KEY-----';

const whitelisted = [
	'id',
	'sub',
	'username',
	'email',
	'name',
	'first_name',
	'given_name',
	'last_name',
	'family_name',
	'preferred_username',
];

const mapKeycloakToRocketChatSchema = function(decodedToken) {
	decodedToken.id = decodedToken.sub;

	if (decodedToken.hasOwnProperty('given_name')) {
		decodedToken.first_name = decodedToken.given_name;
	}

	if (decodedToken.hasOwnProperty('family_name')) {
		decodedToken.last_name = decodedToken.family_name;
	}

	if (!decodedToken.hasOwnProperty('name')) {
		decodedToken.name = `${ decodedToken.first_name } ${ decodedToken.last_name }`;
	}

	if (!decodedToken.hasOwnProperty('preferred_username')) {
		decodedToken.preferred_username = decodedToken.username;
	}

	return _.pick(decodedToken, whitelisted);
};

RocketChat.registerAccessTokenService('keycloak', function(options) {
	check(options, Match.ObjectIncluding({
		accessToken: String,
	}));

	// Decode and verify JWT
	const decoded = jwt.verify(options.accessToken, cert);

	const mappedFields = mapKeycloakToRocketChatSchema(decoded);

	const serviceData = {
		_OAuthCustom: true,
		accessToken: options.accessToken,
		expiresAt: decoded.exp,
	};

	_.extend(serviceData, mappedFields);

	return {
		serviceData,
		options: {
			profile: {
				name: mappedFields.name,
			},
		},
	};
});
