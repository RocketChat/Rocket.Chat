import { useRouter, useSearchParameter, useUserId } from '@rocket.chat/ui-contexts';
import { useEffect } from 'react';

import { buildDeepLinkURL } from '../../../lib/buildAuthDeeplinkURL';
import { readStoredLoginToken } from '../../../lib/sdk/ddpSdk';

export const useShareSessionWithOtherClients = () => {
	const router = useRouter();
	const userId = useUserId();
	const resumeToken = useSearchParameter('resumeToken');
	const loginClient = useSearchParameter('loginClient');

	useEffect(() => {
		if (!userId) {
			return;
		}

		const loginToken = readStoredLoginToken();

		if (!loginToken) {
			return;
		}

		if (resumeToken) {
			return;
		}

		if (loginClient !== 'desktop' && loginClient !== 'mobile') {
			return;
		}

		const loginURL = buildDeepLinkURL(loginToken, userId);
		window.location.href = loginURL;

		const timeout = setTimeout(() => {
			router.navigate('/home', { replace: true });
		}, 100);

		return () => clearTimeout(timeout);
	}, [resumeToken, loginClient, router, userId]);
};
