import type { OauthConfig } from '@rocket.chat/core-typings';

import { CustomOAuth } from '../../custom-oauth/server/custom_oauth_server';

const config: OauthConfig = {
	serverURL: 'https://github.com',
	identityPath: 'https://api.github.com/user',
	tokenPath: 'https://github.com/login/oauth/access_token',
	scope: 'user:email',
	mergeUsers: false,
	addAutopublishFields: {
		forLoggedInUser: ['services.github'],
		forOtherUsers: ['services.github.username'],
	},
	accessTokenParam: 'access_token',
	identityTokenSentVia: 'header',
};

export const Github = new CustomOAuth('github', config);
