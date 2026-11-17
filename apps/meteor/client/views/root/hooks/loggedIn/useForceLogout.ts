import { useGetConnectionSessionId, useSessionDispatch, useStream, useWipeLocalAuth } from '@rocket.chat/ui-contexts';
import { useEffect } from 'react';

export const useForceLogout = (userId: string) => {
	const getNotifyUserStream = useStream('notify-user');
	const setForceLogout = useSessionDispatch('forceLogout');
	const wipeLocalAuth = useWipeLocalAuth();
	const getConnectionSessionId = useGetConnectionSessionId();

	useEffect(() => {
		setForceLogout(false);

		const unsubscribe = getNotifyUserStream(`${userId}/force_logout`, (sessionId) => {
			// A logout aimed at one device names its session; the user's other sessions stay logged in.
			if (sessionId && sessionId !== getConnectionSessionId()) {
				return;
			}

			setForceLogout(true);

			// DDPSDK retries the refused token on every reconnection and swallows the rejection, so the stored
			// credentials are wiped here for the router to fall back to /login.
			wipeLocalAuth();
		});

		return unsubscribe;
	}, [getConnectionSessionId, getNotifyUserStream, setForceLogout, userId, wipeLocalAuth]);
};
