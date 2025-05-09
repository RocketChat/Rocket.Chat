import type { OauthConfig } from '@rocket.chat/core-typings';
import { useSetting } from '@rocket.chat/ui-contexts';
import { useEffect } from 'react';

import { CustomOAuth } from '../../../../app/custom-oauth/client/CustomOAuth';

const configDefault: OauthConfig = {
	serverURL: '',
	addAutopublishFields: {
		forLoggedInUser: ['services.wordpress'],
		forOtherUsers: ['services.wordpress.user_login'],
	},
	accessTokenParam: 'access_token',
};

const WordPress = new CustomOAuth('wordpress', configDefault);

const configureServerType = (
	serverType: string,
	identityPath?: string,
	identityTokenSentVia?: string,
	tokenPath?: string,
	authorizePath?: string,
	scope?: string,
) => {
	switch (serverType) {
		case 'custom': {
			return {
				...configDefault,
				...(identityPath && { identityPath }),
				...(identityTokenSentVia && { identityTokenSentVia }),
				...(tokenPath && { tokenPath }),
				...(authorizePath && { authorizePath }),
				...(scope && { scope }),
			};
		}

		case 'wordpress-com':
			return {
				...configDefault,
				identityPath: 'https://public-api.wordpress.com/rest/v1/me',
				identityTokenSentVia: 'header',
				authorizePath: 'https://public-api.wordpress.com/oauth2/authorize',
				tokenPath: 'https://public-api.wordpress.com/oauth2/token',
				scope: 'auth',
			};

		default:
			return {
				...configDefault,
				identityPath: '/oauth/me',
			};
	}
};

export const useWordPressOAuth = (): void => {
	const wordpressURL = useSetting('API_Wordpress_URL') as string;
	const serverType = useSetting('Accounts_OAuth_Wordpress_server_type') as string;
	const identityPath = useSetting('Accounts_OAuth_Wordpress_identity_path') as string;
	const identityTokenSentVia = useSetting('Accounts_OAuth_Wordpress_identity_token_sent_via') as string;
	const tokenPath = useSetting('Accounts_OAuth_Wordpress_token_path') as string;
	const authorizePath = useSetting('Accounts_OAuth_Wordpress_authorize_path') as string;
	const scope = useSetting('Accounts_OAuth_Wordpress_scope') as string;

	useEffect(() => {
		WordPress.configure({
			...configDefault,
			...configureServerType(serverType, identityPath, identityTokenSentVia, tokenPath, authorizePath, scope),
			serverURL: wordpressURL,
		});
	}, [authorizePath, identityPath, identityTokenSentVia, scope, serverType, tokenPath, wordpressURL]);
};
