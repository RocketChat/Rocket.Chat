import type { OauthConfig } from '@rocket.chat/core-typings';
import { useSetting } from '@rocket.chat/ui-contexts';
import { useEffect } from 'react';

import { CustomOAuth } from '../../../../lib/customOAuth/CustomOAuth';

const config = {
	serverURL: '',
	identityPath: '/oauth/user',
	authorizePath: '/oauth/authorize',
	tokenPath: '/oauth/access-token',
	scope: 'user',
	tokenSentVia: 'payload',
	usernameField: 'username',
	mergeUsers: true,
	addAutopublishFields: {
		forLoggedInUser: ['services.tokenpass'],
		forOtherUsers: ['services.tokenpass.name'],
	},
	accessTokenParam: 'access_token',
} as const satisfies OauthConfig;

const Tokenpass = CustomOAuth.configureOAuthService('tokenpass', config);

export const useTokenpassOAuth = () => {
	const setting = useSetting('API_Tokenpass_URL') as string | undefined;

	useEffect(() => {
		if (!setting) return;

		Tokenpass.configure({
			...config,
			serverURL: setting,
		});
	}, [setting]);
};
