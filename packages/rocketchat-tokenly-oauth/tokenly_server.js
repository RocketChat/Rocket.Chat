Tokenly = {};

let userAgent = 'Meteor';
if (Meteor.release) { userAgent += `/${ Meteor.release }`; }

const getAccessToken = function(query) {
	const config = ServiceConfiguration.configurations.findOne({service: 'tokenly'});
	if (!config) { throw new ServiceConfiguration.ConfigError(); }

	let response;
	try {
		response = HTTP.post(
			'https://tokenly.com/login/oauth/access_token', {
				headers: {
					Accept: 'application/json',
					'User-Agent': userAgent
				},
				params: {
					code: query.code,
					client_id: config.clientId,
					client_secret: OAuth.openSecret(config.secret),
					redirect_uri: OAuth._redirectUri('tokenly', config),
					state: query.state
				}
			});
	} catch (err) {
		throw _.extend(new Error(`Failed to complete OAuth handshake with Tokenly. ${ err.message }`),
			{response: err.response});
	}
	if (response.data.error) {
		throw new Error(`Failed to complete OAuth handshake with GitHub. ${ response.data.error }`);
	} else {
		return response.data.access_token;
	}
};

const getIdentity = function(accessToken) {
	try {
		return HTTP.get(
			'https://api.tokenly.com/user', {
				headers: {'User-Agent': userAgent},
				params: {access_token: accessToken}
			}).data;
	} catch (err) {
		throw _.extend(new Error(`Failed to fetch identity from Tokenly. ${ err.message }`),
			{response: err.response});
	}
};

const getEmails = function(accessToken) {
	try {
		return HTTP.get(
			'https://api.tokenly.com/user/emails', {
				headers: {'User-Agent': userAgent}, // http://developer.tokenly.com/v3/#user-agent-required
				params: {access_token: accessToken}
			}).data;
	} catch (err) {
		return [];
	}
};

OAuth.registerService('tokenly', 2, null, function(query) {
	const accessToken = getAccessToken(query);
	const identity = getIdentity(accessToken);
	const emails = getEmails(accessToken);
	const primaryEmail = _.findWhere(emails, {primary: true});

	return {
		serviceData: {
			id: identity.id,
			accessToken: OAuth.sealSecret(accessToken),
			email: identity.email || (primaryEmail && primaryEmail.email) || '',
			username: identity.login,
			emails
		},
		options: {profile: {name: identity.name}}
	};
});

Tokenly.retrieveCredential = function(credentialToken, credentialSecret) {
	return OAuth.retrieveCredential(credentialToken, credentialSecret);
};
