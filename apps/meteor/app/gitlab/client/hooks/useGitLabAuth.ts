import type { OauthConfig } from '@rocket.chat/core-typings';
import { useSetting } from '@rocket.chat/ui-contexts';
import { useEffect } from 'react';

import { CustomOAuth } from '../../../custom-oauth/client/CustomOAuth';

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
} as const satisfies OauthConfig;

const Gitlab = CustomOAuth.configureOAuthService('gitlab', config);

export const useGitLabAuth = () => {
	const gitlabApiUrl = useSetting('API_Gitlab_URL') as string;
	const gitlabIdentiry = useSetting('Accounts_OAuth_Gitlab_identity_path') as string;
	const gitlabMergeUsers = useSetting('Accounts_OAuth_Gitlab_merge_users', false);

	useEffect(() => {
		Gitlab.configure({
			...config,
			...(gitlabApiUrl && { serverURL: gitlabApiUrl.trim().replace(/\/*$/, '') }),
			...(gitlabIdentiry && { identityPath: gitlabIdentiry.trim() || config.identityPath }),
			...(gitlabMergeUsers && { mergeUsers: true }),
		});
	}, [gitlabApiUrl, gitlabIdentiry, gitlabMergeUsers]);
};
