import { useConnectionSessionId, useSessionDispatch, useStream, useWipeLocalAuth } from '@rocket.chat/ui-contexts';
import { useEffect, useRef } from 'react';

export const useForceLogout = (userId: string) => {
	const getNotifyUserStream = useStream('notify-user');
	const setForceLogout = useSessionDispatch('forceLogout');
	const wipeLocalAuth = useWipeLocalAuth();
	const sessionId = useConnectionSessionId();
	const sessionIdRef = useRef(sessionId);
	sessionIdRef.current = sessionId;

	useEffect(() => {
		setForceLogout(false);

		const unsubscribe = getNotifyUserStream(`${userId}/force_logout`, (eventSessionId) => {
			if (eventSessionId && eventSessionId !== sessionIdRef.current) {
				return;
			}

			setForceLogout(true);

			wipeLocalAuth();
		});

		return unsubscribe;
	}, [getNotifyUserStream, setForceLogout, userId, wipeLocalAuth]);
};
