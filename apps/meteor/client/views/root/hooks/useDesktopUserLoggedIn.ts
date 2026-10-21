import { useIsLoggingIn, useUserId } from '@rocket.chat/ui-contexts';
import { useEffect } from 'react';

import { callDesktopBridge } from '../../../lib/utils/callDesktopBridge';

/** Keeps the desktop app informed of whether a user is logged in to the workspace. */
export const useDesktopUserLoggedIn = () => {
	const loggedIn = Boolean(useUserId());
	const isLoggingIn = useIsLoggingIn();

	useEffect(() => {
		// The desktop app deletes the workspace's login data when it sees a logout, so none is reported while a stored session resumes.
		if (!loggedIn && isLoggingIn) {
			return;
		}

		callDesktopBridge((desktop) => desktop.setUserLoggedIn(loggedIn));
	}, [loggedIn, isLoggingIn]);
};
