/* global CustomOAuth */

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
		forOtherUsers: ['services.drupal.name']
	}
};

const Drupal = new CustomOAuth('drupal', config);

if (Meteor.isServer) {
	Meteor.startup(function() {
		RocketChat.settings.get('API_Drupal_URL', function(key, value) {
			config.serverURL = value;
			Drupal.configure(config);
		});
	});
} else {
	Meteor.startup(function() {
		Tracker.autorun(function() {
			if (RocketChat.settings.get('API_Drupal_URL')) {
				config.serverURL = RocketChat.settings.get('API_Drupal_URL');
				Drupal.configure(config);
			}
		});
	});
}
