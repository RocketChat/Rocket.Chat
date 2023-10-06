import type { OauthConfig } from '@rocket.chat/core-typings';
import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';
import _ from 'underscore';

import { CustomOAuth } from '../../custom-oauth/client/custom_oauth_client';
import { settings } from '../../settings/client';

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

const fillServerURL = _.debounce((): void => {
	const nextcloudURL = settings.get('Accounts_OAuth_Nextcloud_URL');
	if (!nextcloudURL) {
		if (nextcloudURL === undefined) {
			return fillServerURL();
		}
		return;
	}
	config.serverURL = nextcloudURL.trim().replace(/\/*$/, '');
	return Nextcloud.configure(config);
}, 100);

Meteor.startup(() => {
	Tracker.autorun(() => {
		return fillServerURL();
	});
});
