import { useIsLoggingIn, useUserId } from '@rocket.chat/ui-contexts';
import { useEffect } from 'react';

import { fireGlobalEvent } from '../../../lib/utils/fireGlobalEvent';

export const useCustomScript = (): void => {
	const uid = useUserId();
	const isLoggingIn = useIsLoggingIn();

	// While a stored session resumes there is no user id yet, but nobody logged out: the desktop app reads this event as
	// a logout and deletes the workspace's login data. A failed resume clears `isLoggingIn` and still fires it.
	const loggedIn = Boolean(uid);
	const loggedOut = !uid && !isLoggingIn;

	useEffect(() => {
		if (loggedIn) {
			fireGlobalEvent('Custom_Script_Logged_In');
			return;
		}

		if (loggedOut) {
			fireGlobalEvent('Custom_Script_Logged_Out');
		}
	}, [loggedIn, loggedOut]);
};
