import { useUserId, useStream, useSessionDispatch } from '@rocket.chat/ui-contexts';
import { useEffect } from 'react';

export const useForceLogout = () => {
	const userId = useUserId();
	const getNotifyUserStream = useStream('notify-user');
	const setForceLogout = useSessionDispatch('forceLogout');

	useEffect(() => {
		if (!userId) {
			return;
		}

		setForceLogout(false);

		const unsubscribe = getNotifyUserStream(`${userId}/force_logout`, () => {
			setForceLogout(true);
		});

		return unsubscribe;
	}, [getNotifyUserStream, setForceLogout, userId]);
};
