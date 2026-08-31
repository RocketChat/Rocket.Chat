import { useIsLoggingIn, useLoginToken } from '@rocket.chat/ui-contexts';
import { useEffect } from 'react';

export const useStoreCookiesOnLogin = (userId: string) => {
	const isLoggingIn = useIsLoggingIn();
	const loginToken = useLoginToken();

	useEffect(() => {
		// Check for isLoggingIn to be reactive and ensure it will process only after login finishes
		// preventing race condition setting the rc_token as null forever
		if (isLoggingIn === false) {
			const secure = location.protocol === 'https:' ? '; secure' : '';

			document.cookie = `rc_uid=${encodeURI(userId)}; path=/${secure}`;
			document.cookie = `rc_token=${encodeURI(loginToken ?? '')}; path=/${secure}`;
		}
	}, [isLoggingIn, loginToken, userId]);
};
