import { OAuth, type IOAuth1Binding } from 'meteor/oauth';

import { registerOAuth1Service } from './registerOAuth1Service';

export async function configureTwitterOAuth(): Promise<void> {
	const whitelistedFields = ['profile_image_url', 'profile_image_url_https', 'lang', 'email', 'name'];
	const validParamsAuthenticate = ['force_login', 'screen_name'];

	const urls = {
		requestToken: 'https://api.twitter.com/oauth/request_token',
		authorize: 'https://api.twitter.com/oauth/authorize',
		accessToken: 'https://api.twitter.com/oauth/access_token',
		authenticate(oauthBinding: IOAuth1Binding, params: Record<string, any>) {
			return OAuth._queryParamsWithAuthTokenUrl(
				'https://api.twitter.com/oauth/authenticate',
				oauthBinding,
				params,
				validParamsAuthenticate,
			);
		},
	};

	return registerOAuth1Service('twitter', urls, async (oauthBinding) => {
		const response = await oauthBinding.getAsync('https://api.twitter.com/1.1/account/verify_credentials.json?include_email=true');
		const { data: identity } = response;
		// include helpful fields from twitter
		const fields = whitelistedFields.reduce(
			(o, k) => {
				if (identity[k]) {
					o[k] = identity[k];
				}
				return o;
			},
			{} as Partial<typeof identity>,
		);

		const serviceData = {
			id: identity.id_str,
			screenName: identity.screen_name,
			accessToken: OAuth.sealSecret(oauthBinding.accessToken),
			accessTokenSecret: OAuth.sealSecret(oauthBinding.accessTokenSecret),
			...fields,
		};

		return {
			serviceData,
			options: {
				profile: {
					name: identity.name,
				},
			},
		};
	});
}
