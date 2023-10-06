import type { OauthConfig } from '@rocket.chat/core-typings';
import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';

import { CustomOAuth } from '../../custom-oauth/client/custom_oauth_client';
import { settings } from '../../settings/client';

// GitHub Enterprise Server CallBack URL needs to be http(s)://{rocketchat.server}[:port]/_oauth/github_enterprise
// In RocketChat -> Administration the URL needs to be http(s)://{github.enterprise.server}/

const config: OauthConfig = {
	serverURL: '',
	identityPath: '/api/v3/user',
	authorizePath: '/login/oauth/authorize',
	tokenPath: '/login/oauth/access_token',
	addAutopublishFields: {
		forLoggedInUser: ['services.github-enterprise'],
		forOtherUsers: ['services.github-enterprise.username'],
	},
};

const GitHubEnterprise = new CustomOAuth('github_enterprise', config);
Meteor.startup(() => {
	Tracker.autorun(() => {
		if (settings.get('API_GitHub_Enterprise_URL')) {
			config.serverURL = settings.get('API_GitHub_Enterprise_URL');
			GitHubEnterprise.configure(config);
		}
	});
});
