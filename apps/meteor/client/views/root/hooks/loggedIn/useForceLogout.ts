import { useStream, useSessionDispatch } from '@rocket.chat/ui-contexts';
import { useEffect } from 'react';

export const useForceLogout = (userId: string) => {
	const getNotifyUserStream = useStream('notify-user');
	const setForceLogout = useSessionDispatch('forceLogout');

	useEffect(() => {
		setForceLogout(false);

		const unsubscribe = getNotifyUserStream(`${userId}/force_logout`, () => {
			setForceLogout(true);
		});

		return unsubscribe;
	}, [getNotifyUserStream, setForceLogout, userId]);
};
