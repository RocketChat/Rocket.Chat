import { useIsLoggingIn } from '@rocket.chat/ui-contexts';
import { useEffect } from 'react';

import { credentialStorage } from '../../../../lib/sdk/credentialStorage';

export const useStoreCookiesOnLogin = (userId: string) => {
	const isLoggingIn = useIsLoggingIn();

	useEffect(() => {
		// Check for isLoggingIn to be reactive and ensure it will process only after login finishes
		// preventing race condition setting the rc_token as null forever
		if (isLoggingIn === false) {
			const secure = location.protocol === 'https:' ? '; secure' : '';
			const token = credentialStorage.getToken() ?? '';

			document.cookie = `rc_uid=${encodeURI(userId)}; path=/${secure}`;
			document.cookie = `rc_token=${encodeURI(token)}; path=/${secure}`;
		}
	}, [isLoggingIn, userId]);
};
