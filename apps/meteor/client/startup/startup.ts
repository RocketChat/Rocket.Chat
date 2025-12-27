import type { UserStatus } from '@rocket.chat/core-typings';
import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';
import moment from 'moment';

import 'highlight.js/styles/github.css';
import { sdk } from '../../app/utils/client/lib/SDKClient';
import { synchronizeUserData, removeLocalUserData } from '../lib/userData';
import { fireGlobalEvent } from '../lib/utils/fireGlobalEvent';
import { watchUserId } from '../meteor/user';

Meteor.startup(() => {
	if (typeof window !== 'undefined' && window.crypto && !window.crypto.randomUUID) {
		window.crypto.randomUUID = () => {
			if (window.crypto.getRandomValues) {
				const bytes = window.crypto.getRandomValues(new Uint8Array(16));
				bytes[6] = (bytes[6] & 0x0f) | 0x40;
				bytes[8] = (bytes[8] & 0x3f) | 0x80;
				const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
				return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
			}

			return 'xxxxxxxx-xxxx-4xxx-8xxx-xxxxxxxxxxxx'.replace(/[x]/g, () => Math.floor(Math.random() * 16).toString(16));
		};
	}

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
	});
});
