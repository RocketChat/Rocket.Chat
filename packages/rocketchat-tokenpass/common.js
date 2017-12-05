/* global CustomOAuth */

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
		forOtherUsers: ['services.tokenpass.name']
	}
};

const Tokenpass = new CustomOAuth('tokenpass', config);

if (Meteor.isServer) {
	Meteor.startup(function() {
		RocketChat.settings.get('API_Tokenpass_URL', function(key, value) {
			config.serverURL = value;
			Tokenpass.configure(config);
		});
	});
} else {
	Meteor.startup(function() {
		Tracker.autorun(function() {
			if (RocketChat.settings.get('API_Tokenpass_URL')) {
				config.serverURL = RocketChat.settings.get('API_Tokenpass_URL');
				Tokenpass.configure(config);
			}
		});
	});
}
