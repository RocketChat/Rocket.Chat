import { useUserId } from '@rocket.chat/ui-contexts';
import { useEffect } from 'react';

import { callDesktopBridge } from '../../../lib/utils/callDesktopBridge';

/** Keeps the desktop app informed of whether a user is logged in to the workspace. */
export const useDesktopUserLoggedIn = () => {
	const loggedIn = Boolean(useUserId());

	useEffect(() => {
		callDesktopBridge((desktop) => desktop.setUserLoggedIn(loggedIn));
	}, [loggedIn]);
};
