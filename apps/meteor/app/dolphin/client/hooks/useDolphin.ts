import { useSetting } from '@rocket.chat/ui-contexts';
import { useEffect } from 'react';

import { CustomOAuth } from '../../../custom-oauth/client/CustomOAuth';

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
};

const Dolphin = new CustomOAuth('dolphin', config);

export const useDolphin = () => {
	const enabled = useSetting('Accounts_OAuth_Dolphin');
	const url = useSetting('Accounts_OAuth_Dolphin_URL') as string;

	useEffect(() => {
		if (enabled) {
			config.serverURL = url;
			Dolphin.configure(config);
		}
	}, [enabled, url]);
};
