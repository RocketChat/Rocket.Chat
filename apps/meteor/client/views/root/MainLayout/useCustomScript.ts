import { useIsLoggingIn, useUserId } from '@rocket.chat/ui-contexts';
import { useEffect, useRef } from 'react';

import { fireGlobalEvent } from '../../../lib/utils/fireGlobalEvent';

export const useCustomScript = (): void => {
	const uid = useUserId();
	const isLoggingIn = useIsLoggingIn();

	// While a stored session resumes there is no user id yet, but nobody logged out: the desktop app reads this event as
	// a logout and deletes the workspace's login data. A failed resume clears `isLoggingIn` and still fires it.
	const session = uid ?? (isLoggingIn ? undefined : null);

	// A failed login attempt on the login page toggles `isLoggingIn` without a logout, so each event fires once per change.
	const firedFor = useRef<string | null | undefined>(undefined);

	useEffect(() => {
		if (session === undefined || session === firedFor.current) {
			return;
		}

		firedFor.current = session;
		fireGlobalEvent(session ? 'Custom_Script_Logged_In' : 'Custom_Script_Logged_Out');
	}, [session]);
};
