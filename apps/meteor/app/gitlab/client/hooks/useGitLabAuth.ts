import type { OauthConfig } from '@rocket.chat/core-typings';
import { useSetting } from '@rocket.chat/ui-contexts';
import { useEffect } from 'react';

import { CustomOAuth } from '../../../custom-oauth/client/CustomOAuth';

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

export const useGitLabAuth = () => {
	const gitlabApiUrl = useSetting('API_Gitlab_URL') as string;
	const gitlabIdentiry = useSetting('Accounts_OAuth_Gitlab_identity_path') as string;
	const gitlabMergeUsers = useSetting('Accounts_OAuth_Gitlab_merge_users', false);

	useEffect(() => {
		if (gitlabApiUrl) {
			config.serverURL = gitlabApiUrl.trim().replace(/\/*$/, '');
		}

		if (gitlabIdentiry) {
			config.identityPath = gitlabIdentiry.trim() || config.identityPath;
		}

		if (gitlabMergeUsers) {
			config.mergeUsers = true;
		}

		Gitlab.configure(config);
	}, [gitlabApiUrl, gitlabIdentiry, gitlabMergeUsers]);
};
