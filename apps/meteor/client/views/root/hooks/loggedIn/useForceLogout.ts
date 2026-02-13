import { useStream, useSessionDispatch } from '@rocket.chat/ui-contexts';
import { Meteor } from 'meteor/meteor';
import { useEffect } from 'react';

export const useForceLogout = (userId: string) => {
	const getNotifyUserStream = useStream('notify-user');
	const setForceLogout = useSessionDispatch('forceLogout');

	useEffect(() => {
		setForceLogout(false);

		const unsubscribe = getNotifyUserStream(`${userId}/force_logout`, (sessionId) => {
			const currentSessionId = Meteor.connection._lastSessionId;

			if (sessionId === currentSessionId) {
				window.location.reload();
			}

			setForceLogout(true);
		});

		return unsubscribe;
	}, [getNotifyUserStream, setForceLogout, userId]);
};
