import type { OauthConfig } from '@rocket.chat/core-typings';
import { useSetting } from '@rocket.chat/ui-contexts';
import { useEffect } from 'react';

import { CustomOAuth } from '../../../../app/custom-oauth/client/CustomOAuth';

const config: OauthConfig = {
	serverURL: '',
	identityPath: '/oauth/me',
	addAutopublishFields: {
		forLoggedInUser: ['services.wordpress'],
		forOtherUsers: ['services.wordpress.user_login'],
	},
	accessTokenParam: 'access_token',
};

const serverTypeHandlers = {
	'custom': (
		identityPath: string | undefined,
		identityTokenSentVia: string | undefined,
		tokenPath: string | undefined,
		authorizePath: string | undefined,
		scope: string | undefined,
	) => {
		if (identityPath) {
			config.identityPath = identityPath;
		}

		if (identityTokenSentVia) {
			config.identityTokenSentVia = identityTokenSentVia;
		}

		if (tokenPath) {
			config.tokenPath = tokenPath;
		}

		if (authorizePath) {
			config.authorizePath = authorizePath;
		}

		if (scope) {
			config.scope = scope;
		}
	},
	'wordpress-com': () => {
		config.identityPath = 'https://public-api.wordpress.com/rest/v1/me';
		config.identityTokenSentVia = 'header';
		config.authorizePath = 'https://public-api.wordpress.com/oauth2/authorize';
		config.tokenPath = 'https://public-api.wordpress.com/oauth2/token';
		config.scope = 'auth';
	},
	'default': () => {
		config.identityPath = '/oauth/me';
	},
};

const WordPress = new CustomOAuth('wordpress', config);

export const useWordPressOAuth = (): void => {
	const wordpressURL = useSetting('API_Wordpress_URL') as string;
	const serverType = useSetting('Accounts_OAuth_Wordpress_server_type') as string;
	const identityPath = useSetting('Accounts_OAuth_Wordpress_identity_path') as string;
	const identityTokenSentVia = useSetting('Accounts_OAuth_Wordpress_identity_token_sent_via') as string;
	const tokenPath = useSetting('Accounts_OAuth_Wordpress_token_path') as string;
	const authorizePath = useSetting('Accounts_OAuth_Wordpress_authorize_path') as string;
	const scope = useSetting('Accounts_OAuth_Wordpress_scope') as string;

	useEffect(() => {
		if (!wordpressURL) {
			return;
		}

		config.serverURL = wordpressURL;

		delete config.identityPath;
		delete config.identityTokenSentVia;
		delete config.authorizePath;
		delete config.tokenPath;
		delete config.scope;

		(serverTypeHandlers[serverType as keyof typeof serverTypeHandlers] || serverTypeHandlers.default)(
			identityPath,
			identityTokenSentVia,
			tokenPath,
			authorizePath,
			scope,
		);

		console.log('WordPress serverType', serverType);
		console.log('WordPress config', config);

		WordPress.configure(config);
	}, [authorizePath, identityPath, identityTokenSentVia, scope, serverType, tokenPath, wordpressURL]);
};
