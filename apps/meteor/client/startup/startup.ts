import type { UserStatus } from '@rocket.chat/core-typings';
import { Meteor } from 'meteor/meteor';
import { UserPresence } from 'meteor/rocketchat:user-presence';
import { Session } from 'meteor/session';
import { Tracker } from 'meteor/tracker';
import moment from 'moment';

import { getUserPreference } from '../../app/utils/client';
import 'hljs9/styles/github.css';
import { sdk } from '../../app/utils/client/lib/SDKClient';
import { synchronizeUserData, removeLocalUserData } from '../lib/userData';
import { fireGlobalEvent } from '../lib/utils/fireGlobalEvent';

Meteor.startup(() => {
	fireGlobalEvent('startup', true);

	Session.setDefault('AvatarRandom', 0);

	window.lastMessageWindow = {};
	window.lastMessageWindowHistory = {};

	let status: UserStatus | undefined = undefined;
	Tracker.autorun(async () => {
		const uid = Meteor.userId();
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

		const user = await synchronizeUserData(uid);
		if (!user) {
			return;
		}

		const utcOffset = moment().utcOffset() / 60;
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

		UserPresence.start();

		if (user.status !== status) {
			status = user.status;
			fireGlobalEvent('status-changed', status);
		}
	});
});
