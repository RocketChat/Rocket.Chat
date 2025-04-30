import type { UserStatus } from '@rocket.chat/core-typings';
import { useUserId } from '@rocket.chat/ui-contexts';
import { Meteor } from 'meteor/meteor';
import { UserPresence } from 'meteor/rocketchat:user-presence';
import { Session } from 'meteor/session';
import moment from 'moment';
import { useState, useEffect } from 'react';

import { getUserPreference } from '../../app/utils/client';
import { sdk } from '../../app/utils/client/lib/SDKClient';
import { synchronizeUserData, removeLocalUserData } from '../lib/userData';
import { fireGlobalEvent } from '../lib/utils/fireGlobalEvent';

export const useStartup = () => {
	const [status, setStatus] = useState<UserStatus | undefined>(undefined);
	const uid = useUserId();

	useEffect(() => {
		if (!uid) {
			removeLocalUserData();
			return;
		}

		if (!Meteor.status().connected) {
			return;
		}

		if (Meteor.loggingIn()) {
			return;
		}

		const getUser = async () => {
			const utcOffset = moment().utcOffset() / 60;
			const user = await synchronizeUserData(uid);
			if (!user) {
				return;
			}
			if (user.utcOffset !== utcOffset) {
				sdk.call('userSetUtcOffset', utcOffset);
			}

			if (getUserPreference(user, 'enableAutoAway')) {
				const idleTimeLimit = (getUserPreference(user, 'idleTimeLimit') as number | null | undefined) || 300;
				UserPresence.awayTime = idleTimeLimit * 1000;
			} else {
				delete UserPresence.awayTime;
				UserPresence.stopTimer();
			}

			setStatus(user.status);
			UserPresence.start();
		};
		getUser();
	}, [uid]);

	useEffect(() => {
		fireGlobalEvent('startup', true);
		Session.setDefault('AvatarRandom', 0);
	}, []);

	useEffect(() => {
		if (status) {
			fireGlobalEvent('status-changed', status);
		}
	}, [status]);
};
