import { useRouter, useUserId } from '@rocket.chat/ui-contexts';
import { useEffect } from 'react';

import { buildDeepLinkURL } from '../../../lib/buildAuthDeeplinkURL';
import { readStoredLoginToken } from '../../../lib/sdk/ddpSdk';

export const useShareSessionWithOtherClients = () => {
	const router = useRouter();
	const userId = useUserId();

	useEffect(() => {
		if (!userId) {
			return;
		}

		const loginToken = readStoredLoginToken();

		if (!loginToken) {
			return;
		}

		const { resumeToken, loginClient } = router.getSearchParameters();

		if (resumeToken) {
			return;
		}

		if (loginClient !== 'desktop' && loginClient !== 'mobile') {
			return;
		}

		const loginURL = buildDeepLinkURL(loginToken, userId);
		window.location.href = loginURL;

		setTimeout(() => {
			router.navigate('/home', { replace: true });
		}, 100);
	}, [router, userId]);
};
