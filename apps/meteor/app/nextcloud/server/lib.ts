import type { OauthConfig } from '@rocket.chat/core-typings';
import { Meteor } from 'meteor/meteor';

import { CustomOAuth } from '../../custom-oauth/server/custom_oauth_server';
import { settings } from '../../settings/server';
import { debounce } from '../../utils/debounce';

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

const fillServerURL = debounce((): void => {
	const nextcloudURL = settings.get<string>('Accounts_OAuth_Nextcloud_URL');
	if (!nextcloudURL) {
		if (nextcloudURL === undefined) {
			return fillServerURL();
		}
		return;
	}
	config.serverURL = nextcloudURL.trim().replace(/\/*$/, '');
	return Nextcloud.configure(config);
}, 1000);

Meteor.startup(() => {
	settings.watch('Accounts_OAuth_Nextcloud_URL', () => fillServerURL());
});
