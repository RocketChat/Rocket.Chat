import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';

import { settings } from '../../settings';
import { CustomOAuth } from '../../custom-oauth';

const config = {
	serverURL: '',
	identityPath: '/oauth/user',
	authorizePath: '/oauth/authorize',
	tokenPath: '/oauth/access-token',
	scope: 'user,tca,private-balances',
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

if (Meteor.isServer) {
	Meteor.startup(function () {
		settings.watch('API_Tokenpass_URL', function (value) {
			config.serverURL = value;
			Tokenpass.configure(config);
		});
	});
} else {
	Meteor.startup(function () {
		Tracker.autorun(function () {
			if (settings.get('API_Tokenpass_URL')) {
				config.serverURL = settings.get('API_Tokenpass_URL');
				Tokenpass.configure(config);
			}
		});
	});
}
