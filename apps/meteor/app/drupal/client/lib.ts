import type { OauthConfig } from '@rocket.chat/core-typings';
import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';

import { CustomOAuth } from '../../custom-oauth/client/CustomOAuth';
import { settings } from '../../settings/client';

// Drupal Server CallBack URL needs to be http(s)://{rocketchat.server}[:port]/_oauth/drupal
// In RocketChat -> Administration the URL needs to be http(s)://{drupal.server}/

const config: OauthConfig = {
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

Meteor.startup(() => {
	Tracker.autorun(() => {
		if (settings.get('API_Drupal_URL')) {
			config.serverURL = settings.get('API_Drupal_URL');
			Drupal.configure(config);
		}
	});
});
