import { useConnectionStatus } from '@rocket.chat/ui-contexts';
import { Accounts } from 'meteor/accounts-base';
import { useEffect } from 'react';

export const useStoreCookiesOnLogin = (userId: string) => {
	const { isLoggingIn } = useConnectionStatus();

	useEffect(() => {
		// Check for isLoggingIn to be reactive and ensure it will process only after login finishes
		// preventing race condition setting the rc_token as null forever
		if (isLoggingIn === false) {
			const secure = location.protocol === 'https:' ? '; secure' : '';

			document.cookie = `rc_uid=${encodeURI(userId)}; path=/${secure}`;
			document.cookie = `rc_token=${encodeURI(Accounts._storedLoginToken() as string)}; path=/${secure}`;
		}
	}, [isLoggingIn, userId]);
};
