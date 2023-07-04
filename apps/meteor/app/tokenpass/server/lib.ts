import { Meteor } from 'meteor/meteor';
import type { OauthConfig } from '@rocket.chat/core-typings';

import { settings } from '../../settings/server';
import { CustomOAuth } from '../../custom-oauth/server/custom_oauth_server';

const config: OauthConfig = {
	serverURL: '',
	identityPath: '/oauth/user',
	authorizePath: '/oauth/authorize',
	tokenPath: '/oauth/access-token',
	scope: 'user',
	tokenSentVia: 'payload',
	usernameField: 'username',
	mergeUsers: true,
	addAutopublishFields: {
		forLoggedInUser: ['services.tokenpass'],
		forOtherUsers: ['services.tokenpass.name'],
	},
	accessTokenParam: 'access_token',
};

const Tokenpass = new CustomOAuth('tokenpass', config);

Meteor.startup(function () {
	settings.watch<string>('API_Tokenpass_URL', function (value) {
		config.serverURL = value;
		Tokenpass.configure(config);
	});
});
