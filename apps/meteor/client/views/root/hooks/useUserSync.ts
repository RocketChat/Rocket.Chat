import type { UserStatus } from '@rocket.chat/core-typings';
import { useConnectionStatus, useUserId, useUserPreference, useMethod } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import { UserPresence } from 'meteor/rocketchat:user-presence'; // Still needed for UserPresence API
import { Session } from 'meteor/session';
import moment from 'moment';
import { useEffect, useState } from 'react';

import { useFireGlobalEvent } from '../../../hooks/useFireGlobalEvent';
import { synchronizeUserData, removeLocalUserData } from '../../../lib/userData';

export const useUserSync = () => {
	const userId = useUserId();
	const { connected, isLoggingIn } = useConnectionStatus();
	const enableAutoAway = useUserPreference('enableAutoAway');
	const idleTimeLimit = useUserPreference<number>('idleTimeLimit') || 300;
	const userSetUtcOffset = useMethod('userSetUtcOffset');
	const { mutate: fireGlobalEventStartup } = useFireGlobalEvent('startup');
	const { mutate: fireStatusChanged } = useFireGlobalEvent('status-changed');

	const [status, setStatus] = useState<UserStatus | undefined>(undefined);

	useEffect(() => {
		fireGlobalEventStartup(true);

		Session.setDefault('AvatarRandom', 0);

		window.lastMessageWindow = {};
		window.lastMessageWindowHistory = {};
	}, [fireGlobalEventStartup]);

	useEffect(() => {
		if (!userId) {
			removeLocalUserData();
		}
	}, [userId]);

	return useQuery({
		queryKey: ['userData', userId, connected, isLoggingIn],
		queryFn: async () => {
			if (!connected || !userId || isLoggingIn) {
				return null;
			}

			const user = await synchronizeUserData(userId);
			if (!user) {
				return null;
			}

			const utcOffset = moment().utcOffset() / 60;
			if (user.utcOffset !== utcOffset) {
				await userSetUtcOffset(utcOffset);
			}

			if (enableAutoAway) {
				UserPresence.awayTime = idleTimeLimit * 1000;
			} else {
				delete UserPresence.awayTime;
				UserPresence.stopTimer();
			}

			UserPresence.start();
			if (user.status !== status) {
				setStatus(user.status);
				fireStatusChanged(user.status);
			}

			return user;
		},
		enabled: !!userId && connected,
	});
};
