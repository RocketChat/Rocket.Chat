import type { OAuthConfiguration } from '@rocket.chat/core-typings';
import { Meteor } from 'meteor/meteor';
import passport from 'passport';
import _ from 'underscore';

import { addPassportCustomOAuth } from '../../../server/lib/oauth/addPassportCustomOAuth';
import { settings } from '../../settings/server';

const config: Partial<OAuthConfiguration> = {
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

const configureGitlabOAuth = () => {
	passport.unuse('gitlab');

	const enabled = settings.get<boolean>('Accounts_OAuth_Gitlab');
	if (!enabled) {
		return;
	}

	const clientId = settings.get<string>('Accounts_OAuth_Gitlab_id');
	const clientSecret = settings.get<string>('Accounts_OAuth_Gitlab_secret');
	const serverURL = settings.get<string>('API_Gitlab_URL').trim().replace(/\/*$/, '') || config.serverURL;
	const identityPath = settings.get<string>('Accounts_OAuth_Gitlab_identity_path') || config.identityPath;
	const mergeUsers = Boolean(settings.get<boolean>('Accounts_OAuth_Gitlab_merge_users'));

	if (!clientId || !clientSecret) {
		return;
	}

	addPassportCustomOAuth('gitlab', { ...config, clientId, clientSecret, serverURL, identityPath, mergeUsers });
};

Meteor.startup(() => {
	const updateConfig = _.debounce(configureGitlabOAuth, 300);

	settings.watchMultiple(
		[
			'Accounts_OAuth_Gitlab',
			'API_Gitlab_URL',
			'Accounts_OAuth_Gitlab_id',
			'Accounts_OAuth_Gitlab_secret',
			'Accounts_OAuth_Gitlab_identity_path',
			'Accounts_OAuth_Gitlab_merge_users',
		],
		updateConfig,
	);
});
