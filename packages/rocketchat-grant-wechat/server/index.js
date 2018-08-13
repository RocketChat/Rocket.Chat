import { Providers, GrantError } from 'meteor/rocketchat:grant';
import { HTTP } from 'meteor/http';

const userAgent = 'Meteor';
const version = 'v2.10';

function getIdentity(accessToken, fields) {
	try {
		return HTTP.get(
			`https://graph.facebook.com/${ version }/me`, {
				headers: { 'User-Agent': userAgent },
				params: {
					access_token: accessToken,
					fields: fields.join(',')
				}
			}).data;
	} catch (err) {
		throw new GrantError(`Failed to fetch identity from Facebook. ${ err.message }`);
	}
}

function getPicture(accessToken) {
	try {
		return HTTP.get(
			`https://graph.facebook.com/${ version }/me/picture`, {
				headers: { 'User-Agent': userAgent },
				params: {
					redirect: false,
					height: 200,
					width: 200,
					type: 'normal',
					access_token: accessToken
				}
			}).data;
	} catch (err) {
		throw new GrantError(`Failed to fetch profile picture from Facebook. ${ err.message }`);
	}
}

function getAccessToken(req) {
	console.error(req);

	const i = req.url.indexOf('?');

	if (i === -1) {
		return;
	}

	const barePath = req.url.substring(i + 1);
	const splitPath = barePath.split('&');
	const token = splitPath.find(p => p.match(/code=[a-zA-Z0-9]+/));

	if (token) {
		return token.replace('code=', '');
	}
}

export function getUser(code) {
	const whitelisted = ['id', 'email', 'name', 'first_name', 'last_name'];
	const identity = getIdentity(code, whitelisted);
	const avatar = getPicture(code);
	const username = identity.name.toLowerCase().replace(' ', '.');

	return {
		id: identity.id,
		email: identity.email,
		username,
		name: `${ identity.first_name } ${ identity.last_name }`,
		avatar: avatar.data.url
	};
}

// Register Wechat OAuth
Providers.register('wechat', { scope: ['public_profile', 'email'] }, getUser, getAccessToken);
