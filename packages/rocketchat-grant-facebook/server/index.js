import { Providers } from 'meteor/rocketchat:grant';
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
		console.log('err', err);
		throw Object.assign(
			new Error(`Failed to fetch identity from Facebook. ${ err.message }`),
			{ response: err.response }
		);
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
		throw Object.assign(
			new Error(`Failed to fetch profile picture from Facebook. ${ err.message }`),
			{ response: err.response }
		);
	}
}

export function getUser(accessToken) {
	const whitelisted = ['id', 'email', 'name', 'first_name', 'last_name'];
	const identity = getIdentity(accessToken, whitelisted);
	const avatar = getPicture(accessToken);
	const username = identity.name.toLowerCase().replace(' ', '.');

	return {
		id: identity.id,
		email: identity.email,
		username,
		profile: {
			name: `${ identity.first_name } ${ identity.last_name }`,
			avatar: avatar.data.url
		}
	};
}

// Register Facebook OAuth
Providers.register('facebook', { scope: ['public_profile', 'email'] }, getUser);
