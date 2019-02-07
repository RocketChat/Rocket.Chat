import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';
import { RocketChat } from 'meteor/rocketchat:lib';
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
