import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';
import _ from 'underscore';

import { settings } from '../../settings';
import { CustomOAuth } from '../../custom-oauth';

const config = {
	serverURL: 'https://gitlab.com',
	identityPath: '/api/v4/user',
	scope: 'read_user',
	mergeUsers: false,
	addAutopublishFields: {
		forLoggedInUser: ['services.gitlab'],
		forOtherUsers: ['services.gitlab.username'],
	},
	accessTokenParam: 'access_token',
};

const Gitlab = new CustomOAuth('gitlab', config);

if (Meteor.isServer) {
	Meteor.startup(function () {
		const updateConfig = _.debounce(() => {
			config.serverURL = settings.get('API_Gitlab_URL').trim().replace(/\/*$/, '') || config.serverURL;
			config.identityPath = settings.get('Accounts_OAuth_Gitlab_identity_path') || config.identityPath;
			config.mergeUsers = Boolean(settings.get('Accounts_OAuth_Gitlab_merge_users'));
			Gitlab.configure(config);
		}, 300);

		settings.watchMultiple(['API_Gitlab_URL', 'Accounts_OAuth_Gitlab_identity_path', 'Accounts_OAuth_Gitlab_merge_users'], updateConfig);
	});
} else {
	Meteor.startup(function () {
		Tracker.autorun(function () {
			let anyChange = false;
			if (settings.get('API_Gitlab_URL')) {
				config.serverURL = settings.get('API_Gitlab_URL').trim().replace(/\/*$/, '');
				anyChange = true;
			}

			if (settings.get('Accounts_OAuth_Gitlab_identity_path')) {
				config.identityPath = settings.get('Accounts_OAuth_Gitlab_identity_path').trim() || config.identityPath;
				anyChange = true;
			}

			if (settings.get('Accounts_OAuth_Gitlab_merge_users')) {
				config.mergeUsers = true;
				anyChange = true;
			}

			if (anyChange) {
				Gitlab.configure(config);
			}
		});
	});
}
