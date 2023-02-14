import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';

import { settings } from '../../settings';
import { CustomOAuth } from '../../custom-oauth';

// Drupal Server CallBack URL needs to be http(s)://{rocketchat.server}[:port]/_oauth/drupal
// In RocketChat -> Administration the URL needs to be http(s)://{drupal.server}/

const config = {
	serverURL: '',
	identityPath: '/oauth2/UserInfo',
	authorizePath: '/oauth2/authorize',
	tokenPath: '/oauth2/token',
	scope: 'openid email profile offline_access',
	tokenSentVia: 'payload',
	usernameField: 'preferred_username',
	mergeUsers: true,
	addAutopublishFields: {
		forLoggedInUser: ['services.drupal'],
		forOtherUsers: ['services.drupal.name'],
	},
	accessTokenParam: 'access_token',
};

const Drupal = new CustomOAuth('drupal', config);

if (Meteor.isServer) {
	Meteor.startup(function () {
		settings.watch('API_Drupal_URL', function (value) {
			config.serverURL = value;
			Drupal.configure(config);
		});
	});
} else {
	Meteor.startup(function () {
		Tracker.autorun(function () {
			if (settings.get('API_Drupal_URL')) {
				config.serverURL = settings.get('API_Drupal_URL');
				Drupal.configure(config);
			}
		});
	});
}
