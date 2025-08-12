import type { OauthConfig } from '@rocket.chat/core-typings';
import { useSetting } from '@rocket.chat/ui-contexts';
import { useEffect } from 'react';

import { CustomOAuth } from '../../../../lib/customOAuth/CustomOAuth';

const config = {
	serverURL: '',
	authorizePath: '/m/oauth2/auth/',
	tokenPath: '/m/oauth2/token/',
	identityPath: '/m/oauth2/api/me/',
	scope: 'basic',
	addAutopublishFields: {
		forLoggedInUser: ['services.dolphin'],
		forOtherUsers: ['services.dolphin.name'],
	},
	accessTokenParam: 'access_token',
} as const satisfies OauthConfig;

const Dolphin = CustomOAuth.configureOAuthService('dolphin', config);

export const useDolphinOAuth = () => {
	const enabled = useSetting('Accounts_OAuth_Dolphin');
	const url = useSetting('Accounts_OAuth_Dolphin_URL') as string;

	useEffect(() => {
		if (enabled) {
			Dolphin.configure({
				...config,
				serverURL: url,
			});
		}
	}, [enabled, url]);
};
