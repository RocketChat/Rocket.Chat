import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';

import { settings } from '../../settings';
import { CustomOAuth } from '../../custom-oauth';

const config = {
	serverURL: 'https://nextcloud.com',
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

Meteor.startup(function() {
	if (Meteor.isServer) {
		settings.get('Accounts_OAuth_Nextcloud_URL', function(key, nextclodURL) {
			if (!nextclodURL.trim()) {
				return;
			}
			config.serverURL = nextclodURL.trim().replace(/\/*$/, '');
			Nextcloud.configure(config);
		});
	} else {
		Tracker.autorun(function() {
			const nextclodURL = settings.get('Accounts_OAuth_Nextcloud_URL');
			if (!nextclodURL.trim()) {
				return;
			}
			config.serverURL = nextclodURL.trim().replace(/\/*$/, '');
			Nextcloud.configure(config);
		});
	}
});
