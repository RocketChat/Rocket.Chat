import type { OAuthConfiguration } from '@rocket.chat/core-typings';
import { useSearchParameter } from '@rocket.chat/ui-contexts';
import { useCallback } from 'react';

type LoginWithCustomOauthOptions = {
	loginStyle?: OAuthConfiguration['loginStyle'];
};

export const useLoginWithCustomOauth = () => {
	const loginClient = useSearchParameter('loginClient');

	return useCallback(
		(service: string, { loginStyle }: LoginWithCustomOauthOptions = {}): boolean => {
			const loginUrl = new URL(`/oauth/${service}`, window.location.origin);

			if (loginClient) {
				loginUrl.searchParams.set('loginClient', loginClient);
			}

			if (loginStyle === 'popup') {
				return window.open(loginUrl.toString(), 'oauth', 'popup=yes,width=500,height=700,left=100,top=100') !== null;
			}

			window.location.href = loginUrl.toString();
			return true;
		},
		[loginClient],
	);
};
