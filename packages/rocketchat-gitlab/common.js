/* global CustomOAuth */
const config = {
	serverURL: 'https://gitlab.com',
	identityPath: '/api/v3/user',
	scope: 'api',
	addAutopublishFields: {
		forLoggedInUser: ['services.gitlab'],
		forOtherUsers: ['services.gitlab.username']
	}
};

const Gitlab = new CustomOAuth('gitlab', config);

if (Meteor.isServer) {
	Meteor.startup(function() {
		RocketChat.settings.get('API_Gitlab_URL', function(key, value) {
			config.serverURL = value.trim().replace(/\/*$/, '');
			Gitlab.configure(config);
		});
	});
} else {
	Meteor.startup(function() {
		Tracker.autorun(function() {
			if (RocketChat.settings.get('API_Gitlab_URL')) {
				config.serverURL = RocketChat.settings.get('API_Gitlab_URL').trim().replace(/\/*$/, '');
				Gitlab.configure(config);
			}
		});
	});
}
