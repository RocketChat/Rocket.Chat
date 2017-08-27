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
		forLoggedInUser: ['services.tokenly'],
		forOtherUsers: ['services.tokenly.name']
	}
};

const Tokenly = new CustomOAuth('tokenly', config);

if (Meteor.isServer) {
	Meteor.startup(function() {
		RocketChat.settings.get('API_Tokenly_URL', function(key, value) {
			config.serverURL = value;
			Tokenly.configure(config);
		});
	});
} else {
	Meteor.startup(function() {
		Tracker.autorun(function() {
			if (RocketChat.settings.get('API_Tokenly_URL')) {
				config.serverURL = RocketChat.settings.get('API_Tokenly_URL');
				Tokenly.configure(config);
			}
		});
	});
}
