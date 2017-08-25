/*globals Tokenly, OAuth */

'use strict';

Tokenly = {};

let userAgent = 'Meteor';
if (Meteor.release) { userAgent += `/${ Meteor.release }`; }

const getAccessToken = function(query) {
	const config = ServiceConfiguration.configurations.findOne({service: 'tokenly'});
	if (!config) { throw new ServiceConfiguration.ConfigError(); }

	let response;
	try {
		response = HTTP.post(
			'https://tokenpass.tokenly.com/oauth/access-token', {
				headers: {
					Accept: 'application/json',
					'User-Agent': userAgent
				},
				params: {
					grant_type: 'authorization_code',
					code: query.code,
					client_id: config.clientId,
					client_secret: OAuth.openSecret(config.secret),
					redirect_uri: OAuth._redirectUri('tokenly', config),
					state: query.state
				}
			});
	} catch (err) {
		throw _.extend(new Error(`Failed to complete OAuth handshake with Tokenly. ${ err.message }`), {response: err.response});
	}
	if (response.data.error) {
		throw new Error(`Failed to complete OAuth handshake with Tokenly. ${ response.data.error }`);
	} else {
		return response.data.access_token;
	}
};

const getIdentity = function(accessToken) {
	try {
		return HTTP.get(
			'https://tokenpass.tokenly.com/oauth/user', {
				headers: {
					'User-Agent': userAgent
				},
				params: {
					access_token: accessToken
				}
			}).data;
	} catch (err) {
		throw _.extend(new Error(`Failed to fetch identity from Tokenly. ${ err.message }`), {response: err.response});
	}
};

OAuth.registerService('tokenly', 2, null, function(query) {
	const accessToken = getAccessToken(query);
	const identity = getIdentity(accessToken);

	return {
		serviceData: {
			id: identity.id,
			accessToken: OAuth.sealSecret(accessToken),
			email: identity.email || '',
			email_is_confirmed: identity.email_is_confirmed,
			username: identity.username
		},
		options: {profile: {name: identity.name}}
	};
});

Tokenly.retrieveCredential = function(credentialToken, credentialSecret) {
	return OAuth.retrieveCredential(credentialToken, credentialSecret);
};
