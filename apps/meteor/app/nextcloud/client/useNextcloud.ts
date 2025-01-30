import type { OauthConfig } from '@rocket.chat/core-typings';
import { useSetting } from '@rocket.chat/ui-contexts';
import { useEffect } from 'react';

import { CustomOAuth } from '../../custom-oauth/client/CustomOAuth';

const config: OauthConfig = {
	serverURL: '',
	tokenPath: '/index.php/apps/oauth2/api/v1/token',
	tokenSentVia: 'header',
	authorizePath: '/index.php/apps/oauth2/authorize',
	identityPath: '/ocs/v2.php/cloud/user?format=json',
	scope: 'openid',
	addAutopublishFields: {
		forLoggedInUser: ['services.nextcloud'],
		forOtherUsers: ['services.nextcloud.name'],
	},
};

const Nextcloud = new CustomOAuth('nextcloud', config);

export const useNextcloud = (): void => {
	const nextcloudURL = useSetting('Accounts_OAuth_Nextcloud_URL') as string;

	useEffect(() => {
		if (nextcloudURL) {
			config.serverURL = nextcloudURL.trim().replace(/\/*$/, '');
			Nextcloud.configure(config);
		}
	}, [nextcloudURL]);
};
