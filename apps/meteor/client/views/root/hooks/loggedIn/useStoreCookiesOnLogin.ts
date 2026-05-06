import { useIsLoggingIn } from '@rocket.chat/ui-contexts';
import { useEffect } from 'react';

import { getDdpSdk } from '../../../../lib/sdk/ddpSdk';

export const useStoreCookiesOnLogin = (userId: string) => {
	const isLoggingIn = useIsLoggingIn();

	useEffect(() => {
		// Check for isLoggingIn to be reactive and ensure it will process only after login finishes
		// preventing race condition setting the rc_token as null forever
		if (isLoggingIn === false) {
			const secure = location.protocol === 'https:' ? '; secure' : '';
			const token = getDdpSdk().account.storage.getToken() ?? '';

			document.cookie = `rc_uid=${encodeURI(userId)}; path=/${secure}`;
			document.cookie = `rc_token=${encodeURI(token)}; path=/${secure}`;
		}
	}, [isLoggingIn, userId]);
};
