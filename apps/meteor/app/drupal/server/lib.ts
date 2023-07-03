import { Meteor } from 'meteor/meteor';
import type { OauthConfig } from '@rocket.chat/core-typings';

import { settings } from '../../settings/server';
import { CustomOAuth } from '../../custom-oauth/server/custom_oauth_server';

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

Meteor.startup(function () {
	settings.watch<string>('API_Drupal_URL', function (value) {
		config.serverURL = value;
		Drupal.configure(config);
	});
});
