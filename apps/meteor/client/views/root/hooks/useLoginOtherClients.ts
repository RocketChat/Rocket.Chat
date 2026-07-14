import { useRouter, useSearchParameter } from '@rocket.chat/ui-contexts';
import { useEffect } from 'react';

import { buildDeepLinkURL } from '../../../lib/buildAuthDeeplinkURL';

export const useLoginOtherClients = () => {
	const router = useRouter();
	const resumeToken = useSearchParameter('resumeToken');
	const loginClient = useSearchParameter('loginClient');
	const userId = useSearchParameter('userId');

	useEffect(() => {
		if (!resumeToken || !userId) {
			return;
		}

		if (loginClient !== 'desktop' && loginClient !== 'mobile') {
			return;
		}

		const loginURL = buildDeepLinkURL(resumeToken, userId);
		window.location.href = loginURL;

		const timeout = setTimeout(() => {
			router.navigate('/home', { replace: true });
		}, 0);

		return () => clearTimeout(timeout);
	}, [resumeToken, userId, loginClient, router]);
};
