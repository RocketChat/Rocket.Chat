import type { OauthConfig } from '@rocket.chat/core-typings';
import { Meteor } from 'meteor/meteor';
import _ from 'underscore';

import { CustomOAuth } from '../../custom-oauth/server/custom_oauth_server';
import { settings } from '../../settings/server';

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

Meteor.startup(() => {
	const updateConfig = _.debounce(() => {
		config.serverURL = settings.get<string>('API_Gitlab_URL').trim().replace(/\/*$/, '') || config.serverURL;
		config.identityPath = settings.get('Accounts_OAuth_Gitlab_identity_path') || config.identityPath;
		config.mergeUsers = Boolean(settings.get<boolean>('Accounts_OAuth_Gitlab_merge_users'));
		Gitlab.configure(config);
	}, 300);

	settings.watchMultiple(['API_Gitlab_URL', 'Accounts_OAuth_Gitlab_identity_path', 'Accounts_OAuth_Gitlab_merge_users'], updateConfig);
});
