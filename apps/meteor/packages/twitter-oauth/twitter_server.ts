import { OAuth } from 'meteor/oauth';

declare global {
	var Twitter: {
		validParamsAuthenticate: string[];
		whitelistedFields: string[];
		retrieveCredential: (credentialToken: string, credentialSecret: string) => any;
	};
}

Twitter = {} as typeof Twitter;

Twitter.validParamsAuthenticate = ['force_login', 'screen_name'];

const urls = {
	requestToken: 'https://api.twitter.com/oauth/request_token',
	authorize: 'https://api.twitter.com/oauth/authorize',
	accessToken: 'https://api.twitter.com/oauth/access_token',
	authenticate(oauthBinding: any, params: Record<string, any>) {
		return OAuth._queryParamsWithAuthTokenUrl(
			'https://api.twitter.com/oauth/authenticate',
			oauthBinding,
			params,
			Twitter.validParamsAuthenticate,
		);
	},
};

// https://dev.twitter.com/docs/api/1.1/get/account/verify_credentials
Twitter.whitelistedFields = ['profile_image_url', 'profile_image_url_https', 'lang', 'email', 'name'];

OAuth.registerService('twitter', 1, urls, async (oauthBinding) => {
	const response = await oauthBinding.getAsync('https://api.twitter.com/1.1/account/verify_credentials.json?include_email=true');
	const { data: identity } = response;
	const serviceData = {
		id: identity.id_str,
		screenName: identity.screen_name,
		accessToken: OAuth.sealSecret(oauthBinding.accessToken),
		accessTokenSecret: OAuth.sealSecret(oauthBinding.accessTokenSecret),
	};

	// include helpful fields from twitter
	const fields = Twitter.whitelistedFields.reduce<Record<string, string>>((o, k) => {
		if (identity[k]) o[k] = identity[k];
		return o;
	}, {});
	Object.assign(serviceData, fields);

	return {
		serviceData,
		options: {
			profile: {
				name: identity.name,
			},
		},
	};
});

Twitter.retrieveCredential = function (credentialToken, credentialSecret) {
	return OAuth.retrieveCredential(credentialToken, credentialSecret);
};
