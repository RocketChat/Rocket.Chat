import { useIsLoggingIn } from '@rocket.chat/ui-contexts';
import { useEffect } from 'react';

import { useUserStorageValue } from '../../../../hooks/useUserStorageValue';
import { LOGIN_TOKEN_KEY } from '../../../../lib/user';

export const useStoreCookiesOnLogin = (userId: string) => {
	const isLoggingIn = useIsLoggingIn();
	const loginToken = useUserStorageValue(LOGIN_TOKEN_KEY);

	useEffect(() => {
		// Check for isLoggingIn to be reactive and ensure it will process only after login finishes
		// preventing race condition setting the rc_token as null forever
		if (isLoggingIn !== false) return;

		const secure = location.protocol === 'https:' ? '; secure' : '';

		document.cookie = `rc_uid=${encodeURI(userId)}; path=/${secure}`;
		document.cookie = `rc_token=${encodeURI(loginToken ?? '')}; path=/${secure}`;
	}, [isLoggingIn, loginToken, userId]);
};
