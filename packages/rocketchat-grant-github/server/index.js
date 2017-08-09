import { Providers } from 'meteor/rocketchat:grant';
import { HTTP } from 'meteor/http';

const userAgent = 'Meteor';

function getIdentity(accessToken) {
	try {
		return HTTP.get(
			'https://api.github.com/user', {
				headers: { 'User-Agent': userAgent }, // http://developer.github.com/v3/#user-agent-required
				params: { access_token: accessToken }
			}).data;
	} catch (err) {
		throw Object.assign(
			new Error(`Failed to fetch identity from Github. ${ err.message }`),
			{ response: err.response }
		);
	}
}

function getEmails(accessToken) {
	try {
		return HTTP.get(
			'https://api.github.com/user/emails', {
				headers: { 'User-Agent': userAgent }, // http://developer.github.com/v3/#user-agent-required
				params: { access_token: accessToken }
			}).data;
	} catch (err) {
		return [];
	}
}

export function getUser(accessToken) {
	const identity = getIdentity(accessToken);
	const emails = getEmails(accessToken);
	const primaryEmail = (emails || []).find(email => email.primary === true);

	return {
		id: identity.id,
		email: identity.email || (primaryEmail && primaryEmail.email) || '',
		username: identity.login,
		emails,
		profile: {
			name: identity.name,
			avatar: identity.avatar_url
		}
	};
}

// Register GitHub OAuth
Providers.register('github', { scope: ['user', 'user:email'] }, getUser);
