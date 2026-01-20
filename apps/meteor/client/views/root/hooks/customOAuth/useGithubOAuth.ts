import type { OauthConfig } from '@rocket.chat/core-typings';
import { useSetting } from '@rocket.chat/ui-contexts';
import { useEffect } from 'react';

import { CustomOAuth } from '../../../../lib/customOAuth/CustomOAuth';

const config: OauthConfig = {
	authorizePath: 'https://github.com/login/oauth/authorize',
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
} as const satisfies OauthConfig;

const Github = CustomOAuth.configureOAuthService('github', config);

export const useGithubOAuth = () => {
	const enabled = useSetting('Accounts_OAuth_Github');

	useEffect(() => {
		if (enabled) {
			Github.configure({
				...config,
			});
		}
	}, [enabled]);
};
