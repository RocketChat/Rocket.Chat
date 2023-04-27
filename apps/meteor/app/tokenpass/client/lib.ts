import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';
import type { OauthConfig } from '@rocket.chat/core-typings';

import { settings } from '../../settings/client';
import { CustomOAuth } from '../../custom-oauth/client/custom_oauth_client';

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
	Tracker.autorun(function () {
		if (settings.get('API_Tokenpass_URL')) {
			config.serverURL = settings.get('API_Tokenpass_URL');
			Tokenpass.configure(config);
		}
	});
});
