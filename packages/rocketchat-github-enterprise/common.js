/* global CustomOAuth */

// GitHub Enterprise Server CallBack URL needs to be http(s)://{rocketchat.server}[:port]/_oauth/github_enterprise
// In RocketChat -> Administration the URL needs to be http(s)://{github.enterprise.server}/

const config = {
	serverURL: '',
	identityPath: '/api/v3/user',
	authorizePath: '/login/oauth/authorize',
	tokenPath: '/login/oauth/access_token',
	addAutopublishFields: {
		forLoggedInUser: ['services.github-enterprise'],
		forOtherUsers: ['services.github-enterprise.username']
	}
};

const GitHubEnterprise = new CustomOAuth('github_enterprise', config);

if (Meteor.isServer) {
	Meteor.startup(function() {
		RocketChat.settings.get('API_GitHub_Enterprise_URL', function(key, value) {
			config.serverURL = value;
			GitHubEnterprise.configure(config);
		});
	});
} else {
	Meteor.startup(function() {
		Tracker.autorun(function() {
			if (RocketChat.settings.get('API_GitHub_Enterprise_URL')) {
				config.serverURL = RocketChat.settings.get('API_GitHub_Enterprise_URL');
				GitHubEnterprise.configure(config);
			}
		});
	});
}
