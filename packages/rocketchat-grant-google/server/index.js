import { Providers, GrantError } from 'meteor/rocketchat:grant';
import { HTTP } from 'meteor/http';

const userAgent = 'Meteor';

function getIdentity(accessToken) {
	try {
		return HTTP.get(
			'https://www.googleapis.com/oauth2/v1/userinfo', {
				headers: { 'User-Agent': userAgent },
				params: {
					access_token: accessToken
				}
			}).data;
	} catch (err) {
		throw new GrantError(`Failed to fetch identity from Google. ${ err.message }`);
	}
}

export function getUser(accessToken) {
	const whitelisted = [
		'id', 'email', 'verified_email', 'name',
		'given_name', 'family_name', 'picture'
	];
	const identity = getIdentity(accessToken, whitelisted);
	const username = `${ identity.given_name.toLowerCase() }.${ identity.family_name.toLowerCase() }`;

	return {
		id: identity.id,
		email: identity.email,
		username,
		name: identity.name,
		avatar: identity.picture
	};
}

// Register Google OAuth
Providers.register('google', { scope: ['openid', 'email'] }, getUser);
