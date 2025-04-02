import { useUserId, useStream } from '@rocket.chat/ui-contexts';
import { Session } from 'meteor/session';
import { useEffect } from 'react';

export const useForceLogout = () => {
	const userId = useUserId();
	const getNotifyUserStream = useStream('notify-user');

	useEffect(() => {
		if (!userId) {
			return;
		}

		Session.set('force_logout', false);

		const unsubscribe = getNotifyUserStream(`${userId}/force_logout`, () => {
			Session.set('force_logout', true);
		});

		return unsubscribe;
	}, [userId, getNotifyUserStream]);
};
