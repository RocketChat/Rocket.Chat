import type { OauthConfig } from '@rocket.chat/core-typings';
import { useSetting } from '@rocket.chat/ui-contexts';
import { useEffect } from 'react';

import { CustomOAuth } from '../../../custom-oauth/client/CustomOAuth';

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

export const useGitHubEnterpriseAuth = () => {
	const githubApiUrl = useSetting('API_GitHub_Enterprise_URL') as string;

	useEffect(() => {
		if (githubApiUrl) {
			config.serverURL = githubApiUrl;
			GitHubEnterprise.configure(config);
		}
	}, [githubApiUrl]);
};
