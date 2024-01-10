import { fetch } from 'meteor/fetch';
import { OAuth } from 'meteor/oauth';
import { ServiceConfiguration } from 'meteor/service-configuration';

export const Linkedin = {};

// returns an object containing:
// - accessToken
// - expiresIn: lifetime of token in seconds
const getTokenResponse = async function (query) {
	const config = await ServiceConfiguration.configurations.findOneAsync({ service: 'linkedin' });
	if (!config) throw new Accounts.ConfigError('Service not configured');

	let responseContent;
	try {
		// Request an access token
		const body = new URLSearchParams({
			grant_type: 'authorization_code',
			client_id: config.clientId,
			client_secret: OAuth.openSecret(config.secret),
			code: query.code,
			redirect_uri: OAuth._redirectUri('linkedin', config),
		});

		const response = await fetch('https://api.linkedin.com/uas/oauth2/accessToken', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded',
			},
			body,
		});

		if (!response.ok) {
			throw new Error(responseContent.error_description);
		}

		responseContent = await response.json();
	} catch (err) {
		throw new Error(`Failed to complete OAuth handshake with Linkedin. ${err.message}`);
	}

	// Success! Extract access token and expiration
	const accessToken = responseContent.access_token;
	const expiresIn = responseContent.expires_in;

	if (!accessToken) {
		throw new Error(`Failed to complete OAuth handshake with Linkedin -- can't find access token in HTTP response. ${JSON.stringify(responseContent)}`);
	}

	return {
		accessToken,
		expiresIn,
	};
};

// Request available fields from profile
const getIdentity = async function (accessToken) {
	try {
		const url = encodeURI(
			`https://api.linkedin.com/v2/userinfo`,
		);
		const request = await fetch(url, {
			method: 'GET',
			headers: {
				Authorization: `Bearer ${accessToken}`,
			},
		});

		if (!request.ok) {
			throw new Error(await request.text());
		}

		return request.json();
	} catch (err) {
		throw new Error(`Failed to fetch identity from Linkedin. ${err.message}`);
	}
};

OAuth.registerService('linkedin', 2, null, async (query) => {
	const response = await getTokenResponse(query);
	const { accessToken } = response;
	const identity = await getIdentity(accessToken);

	const { sub, given_name, family_name, picture, email } = identity;

	if (!sub) {
		throw new Error('Linkedin did not provide an id');
	}

	const fields = {
		linkedinId: sub,
		firstName: given_name,
		lastName: family_name,
		profilePicture: picture,
		emailAddress: email,
		email
	};

	const serviceData = {
		id: sub,
		accessToken,
		expiresAt: +new Date() + 1000 * response.expiresIn,
		...fields,
	};

	return {
		serviceData,
		options: {
			profile: fields,
		},
	};
});

Linkedin.retrieveCredential = function (credentialToken, credentialSecret) {
	return OAuth.retrieveCredential(credentialToken, credentialSecret);
};
