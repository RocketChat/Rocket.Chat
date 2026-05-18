import { useRouter } from '@rocket.chat/ui-contexts';
import { useEffect } from 'react';

import { buildDeepLinkURL } from '../../../lib/buildAuthDeeplinkURL';

export const useLoginOtherClients = () => {
	const router = useRouter();

	useEffect(() => {
		const { resumeToken, loginClient, userId } = router.getSearchParameters();

		if (!resumeToken || !userId) {
			return;
		}

		if (loginClient !== 'desktop' && loginClient !== 'mobile') {
			return;
		}

		const loginURL = buildDeepLinkURL(resumeToken, userId);
		window.location.href = loginURL;

		setTimeout(() => {
			router.navigate('/home', { replace: true });
		}, 100);
	}, [router]);
};
