import type { UserStatus } from '@rocket.chat/core-typings';
import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import { useConnectionStatus, useUserId, useUserPreference, useMethod } from '@rocket.chat/ui-contexts';
import { UserPresence } from 'meteor/rocketchat:user-presence'; // Still needed for UserPresence API
import { Session } from 'meteor/session';
import moment from 'moment';
import { useEffect, useState } from 'react';

import { useFireGlobalEvent } from '../../../hooks/useFireGlobalEvent';
import { synchronizeUserData, removeLocalUserData } from '../../../lib/userData';

export const useUserSync = (): void => {
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

	const syncUserData = async () => {
		if (!connected || !userId || isLoggingIn) {
			return;
		}

		const user = await synchronizeUserData(userId);
		if (!user) {
			return;
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
	};

	const handleUserSync = useEffectEvent(async () => {
		if (userId) {
			await syncUserData();
			return;
		}

		removeLocalUserData();
	});

	useEffect(() => {
		void handleUserSync();
	}, [handleUserSync]);
};
