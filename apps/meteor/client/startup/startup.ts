import type { UserStatus } from '@rocket.chat/core-typings';
import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';
import moment from 'moment';

import 'highlight.js/styles/github.css';
import { sdk } from '../../app/utils/client/lib/SDKClient';
import { synchronizeUserData, removeLocalUserData } from '../lib/userData';
import { fireGlobalEvent } from '../lib/utils/fireGlobalEvent';
import { watchUserId } from '../meteor/user';

function isAuthError(error: unknown): boolean {
	if (!error || typeof error !== 'object') {
		return false;
	}

	if ('error' in error && error.error === 'unauthorized') {
		return true;
	}

	if ('code' in error && (error.code === 401 || error.code === 403)) {
		return true;
	}

	if ('message' in error && typeof error.message === 'string' && error.message.toLowerCase().includes('unauthorized')) {
		return true;
	}

	return false;
}

Meteor.startup(() => {
	let status: UserStatus | undefined = undefined;
	Tracker.autorun(async () => {
		const uid = watchUserId();
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

		try {
			const user = await synchronizeUserData(uid);
			if (!user) {
				return;
			}

			const utcOffset = moment().utcOffset() / 60;
			if (user.utcOffset !== utcOffset) {
				sdk.call('userSetUtcOffset', utcOffset);
			}

			if (user.status !== status) {
				status = user.status;
				fireGlobalEvent('status-changed', status);
			}
		} catch (error) {
			console.error('Error synchronizing user data:', error);

			if (isAuthError(error)) {
				console.error('Authentication error detected. Clearing local auth state and logging out.', { userId: uid, error });
				removeLocalUserData();
				Meteor.logout();
			}
		}
	});
});
