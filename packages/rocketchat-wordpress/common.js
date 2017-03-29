/* globals CustomOAuth */

const config = {
	serverURL: '',
	identityPath: '/oauth/me',
	addAutopublishFields: {
		forLoggedInUser: ['services.wordpress'],
		forOtherUsers: ['services.wordpress.user_login']
	}
};

const WordPress = new CustomOAuth('wordpress', config);

if (Meteor.isServer) {
	Meteor.startup(function() {
		return RocketChat.settings.get('API_Wordpress_URL', function(key, value) {
			config.serverURL = value;
			return WordPress.configure(config);
		});
	});
} else {
	Meteor.startup(function() {
		return Tracker.autorun(function() {
			if (RocketChat.settings.get('API_Wordpress_URL')) {
				config.serverURL = RocketChat.settings.get('API_Wordpress_URL');
				return WordPress.configure(config);
			}
		});
	});
}
