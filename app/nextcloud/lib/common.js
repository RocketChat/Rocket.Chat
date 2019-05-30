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

if (Meteor.isServer) {
	Meteor.startup(function() {
		settings.get('Accounts_OAuth_Nextcloud_URL', function(key, value) {
			config.serverURL = value.trim().replace(/\/*$/, '');
			Nextcloud.configure(config);
		});
	});
} else {
	Meteor.startup(function() {
		Tracker.autorun(function() {
			if (settings.get('Accounts_OAuth_Nextcloud_URL')) {
				config.serverURL = settings.get('Accounts_OAuth_Nextcloud_URL').trim().replace(/\/*$/, '');
				Nextcloud.configure(config);
			}
		});
	});
}
