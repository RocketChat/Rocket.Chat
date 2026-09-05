import { OAuth } from 'meteor/oauth';
import { ServiceConfiguration } from 'meteor/service-configuration';

declare global {
	var MeteorDeveloperAccounts: {
		_server: string;
		_config: (options: { developerAccountsServer?: string }) => void;
		retrieveCredential: (credentialToken: string, credentialSecret: string) => any;
	};
}

MeteorDeveloperAccounts = {} as typeof MeteorDeveloperAccounts;

MeteorDeveloperAccounts._server = 'https://www.meteor.com';

// Options are:
//  - developerAccountsServer: defaults to "https://www.meteor.com"
MeteorDeveloperAccounts._config = (options) => {
	if (options.developerAccountsServer) {
		MeteorDeveloperAccounts._server = options.developerAccountsServer;
	}
};

OAuth.registerService('meteor-developer', 2, null, async (query) => {
	const response = await getTokens(query);
	const { accessToken } = response;
	const identity = await getIdentity(accessToken);

	const serviceData: {
		accessToken?: string;
		expiresAt?: number;
		refreshToken?: string;
		username?: string;
	} = {
		accessToken: OAuth.sealSecret(accessToken),
		expiresAt: Date.now() + 1000 * response.expiresIn,
	};

	Object.assign(serviceData, identity);

	// only set the token in serviceData if it's there. this ensures
	// that we don't lose old ones (since we only get this on the first
	// log in attempt)
	if (response.refreshToken) serviceData.refreshToken = OAuth.sealSecret(response.refreshToken);

	return {
		serviceData,
		options: { profile: { name: serviceData.username } },
		// XXX use username for name until meteor accounts has a profile with a name
	};
});

// returns an object containing:
// - accessToken
// - expiresIn: lifetime of token in seconds
// - refreshToken, if this is the first authorization request and we got a
//   refresh token from the server
const getTokens = async (query: Record<string, any>) => {
	const config = await ServiceConfiguration.configurations.findOneAsync({
		service: 'meteor-developer',
	});
	if (!config) {
		throw new ServiceConfiguration.ConfigError();
	}

	const body = OAuth._addValuesToQueryParams({
		grant_type: 'authorization_code',
		code: query.code,
		client_id: config.clientId,
		client_secret: OAuth.openSecret(config.secret),
		redirect_uri: OAuth._redirectUri('meteor-developer', config),
	}).toString();

	return OAuth._fetch(`${MeteorDeveloperAccounts._server}/oauth2/token`, 'POST', {
		headers: {
			'Accept': 'application/json',
			'Content-type': 'application/x-www-form-urlencoded',
		},
		body,
	})
		.then((data) => data.json())
		.then((data) => {
			if (data.error) {
				throw new Error(`Failed to complete OAuth handshake with Meteor developer accounts. ${data ? data.error : 'No response data'}`);
			}
			return {
				accessToken: data.access_token,
				refreshToken: data.refresh_token,
				expiresIn: data.expires_in,
			};
		})
		.catch((err) => {
			throw Object.assign(new Error(`Failed to complete OAuth handshake with Meteor developer accounts. ${err.message}`), {
				response: err.response,
			});
		});
};

const getIdentity = async (accessToken: string) => {
	return OAuth._fetch(`${MeteorDeveloperAccounts._server}/api/v1/identity`, 'GET', {
		headers: { Authorization: `Bearer ${accessToken}` },
	})
		.then((data) => data.json())
		.catch((err) => {
			throw Object.assign(new Error(`Failed to fetch identity from Meteor developer accounts. ${err.message}`), { response: err.response });
		});
};

MeteorDeveloperAccounts.retrieveCredential = (credentialToken, credentialSecret) =>
	OAuth.retrieveCredential(credentialToken, credentialSecret);
