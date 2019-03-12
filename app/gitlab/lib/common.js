import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';
import { settings } from 'meteor/rocketchat:settings';
import { CustomOAuth } from 'meteor/rocketchat:custom-oauth';

const config = {
	serverURL: 'https://gitlab.com',
	identityPath: '/api/v3/user',
	scope: 'read_user',
	addAutopublishFields: {
		forLoggedInUser: ['services.gitlab'],
		forOtherUsers: ['services.gitlab.username'],
	},
};

const Gitlab = new CustomOAuth('gitlab', config);

if (Meteor.isServer) {
	Meteor.startup(function() {
		settings.get('API_Gitlab_URL', function(key, value) {
			config.serverURL = value.trim().replace(/\/*$/, '');
			Gitlab.configure(config);
		});
	});
} else {
	Meteor.startup(function() {
		Tracker.autorun(function() {
			if (settings.get('API_Gitlab_URL')) {
				config.serverURL = settings.get('API_Gitlab_URL').trim().replace(/\/*$/, '');
				Gitlab.configure(config);
			}
		});
	});
}
