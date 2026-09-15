import { Accounts } from 'meteor/accounts-base';
import { Meteor } from 'meteor/meteor';
import { OAuth } from 'meteor/oauth';
import { ServiceConfiguration } from 'meteor/service-configuration';

declare global {
	var Google: {
		whitelistedFields: string[];
		retrieveCredential: (credentialToken: string, credentialSecret: string) => any;
	};
}

Google = {} as typeof Google;

// https://developers.google.com/accounts/docs/OAuth2Login#userinfocall
Google.whitelistedFields = [
	'id',
	'email',
	'verified_email',
	'name',
	'given_name',
	'family_name',
	'picture',
	'locale',
	'timezone',
	'gender',
];

// returns an object containing:
// - accessToken
// - expiresIn: lifetime of token in seconds
// - refreshToken, if this is the first authorization request
const getTokens = async (query: Record<string, any>, callback?: (err?: any, data?: any) => void) => {
	const config = await ServiceConfiguration.configurations.findOneAsync({
		service: 'google',
	});
	if (!config) throw new ServiceConfiguration.ConfigError();

	const content = new URLSearchParams({
		code: query.code,
		client_id: config.clientId!,
		client_secret: OAuth.openSecret(config.secret),
		redirect_uri: OAuth._redirectUri('google', config),
		grant_type: 'authorization_code',
	});
	const request = await OAuth._fetch('https://accounts.google.com/o/oauth2/token', 'POST', {
		headers: {
			'Accept': 'application/json',
			'Content-Type': 'application/x-www-form-urlencoded',
		},
		body: content,
	});
	const response = await request.json();

	if (response.error) {
		// if the http response was a json object with an error attribute
		callback?.(response.error);
		throw new Meteor.Error(`Failed to complete OAuth handshake with Google. ${response.error}`);
	} else {
		const data = {
			accessToken: response.access_token,
			refreshToken: response.refresh_token,
			expiresIn: response.expires_in,
			idToken: response.id_token,
		};
		callback?.(undefined, data);
		return data;
	}
};

const getScopes = async (accessToken: string, callback?: (err?: any, data?: any) => void) => {
	const content = new URLSearchParams({ access_token: accessToken });
	let response: { scope: string };
	try {
		const request = await OAuth._fetch(`https://www.googleapis.com/oauth2/v1/tokeninfo?${content.toString()}`, 'GET', {
			headers: { Accept: 'application/json' },
		});
		response = await request.json();
	} catch (e) {
		callback?.(e);
		throw new Meteor.Error((e as { reason: string | number }).reason);
	}
	callback?.(undefined, response.scope.split(' '));
	return response.scope.split(' ');
};

const getIdentity = async (accessToken: string, callback?: (err?: any, data?: any) => void) => {
	const content = new URLSearchParams({ access_token: accessToken });
	let response;
	try {
		const request = await OAuth._fetch(`https://www.googleapis.com/oauth2/v1/userinfo?${content.toString()}`, 'GET', {
			headers: { Accept: 'application/json' },
		});
		response = await request.json();
	} catch (e) {
		callback?.(e);
		throw new Meteor.Error((e as { reason: string | number }).reason);
	}
	callback?.(undefined, response);
	return response;
};

const getServiceDataFromTokens = async (
	tokens: { accessToken: string; idToken: string; expiresIn?: string; refreshToken?: string },
	callback?: (err?: any, data?: any) => void,
) => {
	const { accessToken, idToken } = tokens;
	const scopes = await getScopes(accessToken).catch((err) => {
		const error = Object.assign(new Error(`Failed to fetch tokeninfo from Google. ${err.message}`), { response: err.response });
		callback?.(error);
		throw error;
	});

	const identity = await getIdentity(accessToken).catch((err) => {
		const error = Object.assign(new Error(`Failed to fetch identity from Google. ${err.message}`), { response: err.response });
		callback?.(error);
		throw error;
	});
	const serviceData: {
		accessToken?: string;
		idToken?: string;
		scope?: string[];
		expiresAt?: number;
		refreshToken?: string;
	} = {
		accessToken,
		idToken,
		scope: scopes,
	};

	if (Object.hasOwn(tokens, 'expiresIn')) {
		serviceData.expiresAt = Date.now() + 1000 * parseInt(tokens.expiresIn!, 10);
	}

	const fields = Object.create(null);
	Google.whitelistedFields.forEach((name) => {
		if (Object.hasOwn(identity, name)) {
			fields[name] = identity[name];
		}
	});

	Object.assign(serviceData, fields);

	// only set the token in serviceData if it's there. this ensures
	// that we don't lose old ones (since we only get this on the first
	// log in attempt)
	if (tokens.refreshToken) {
		serviceData.refreshToken = tokens.refreshToken;
	}
	const returnValue = {
		serviceData,
		options: {
			profile: {
				name: identity.name,
			},
		},
	};

	callback?.(undefined, returnValue);

	return returnValue;
};

Accounts.registerLoginHandler(null, async (request) => {
	if (request.googleSignIn !== true) {
		return;
	}
	const tokens = {
		accessToken: request.accessToken,
		refreshToken: request.refreshToken,
		idToken: request.idToken,
	};

	if (request.serverAuthCode) {
		Object.assign(
			tokens,
			await getTokens({
				code: request.serverAuthCode,
			}),
		);
	}

	let result;
	try {
		result = await getServiceDataFromTokens(tokens);
	} catch (err) {
		throw Object.assign(new Error(`Failed to complete OAuth handshake with Google. ${(err as { message: string }).message}`), {
			response: (err as { response: any }).response,
		});
	}
	return Accounts.updateOrCreateUserFromExternalService(
		'google',
		{
			id: request.userId,
			idToken: request.idToken,
			accessToken: request.accessToken,
			email: request.email,
			picture: request.imageUrl,
			...result.serviceData,
		},
		result.options,
	);
});

const getServiceData = async (query: Record<string, any>) => getServiceDataFromTokens(await getTokens(query));

OAuth.registerService('google', 2, null, getServiceData);

Google.retrieveCredential = (credentialToken: string, credentialSecret: string) =>
	OAuth.retrieveCredential(credentialToken, credentialSecret);
