import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';
import type { OauthConfig } from '@rocket.chat/core-typings';

import { settings } from '../../settings/client';
import { CustomOAuth } from '../../custom-oauth/client/custom_oauth_client';

const config: OauthConfig = {
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
