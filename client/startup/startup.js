import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';
import { Session } from 'meteor/session';
import { TimeSync } from 'meteor/mizzao:timesync';
import { UserPresence } from 'meteor/konecty:user-presence';
import toastr from 'toastr';
import hljs from 'highlight.js';

import { fireGlobalEvent } from '../../app/ui-utils';
import { getUserPreference } from '../../app/utils';
import 'highlight.js/styles/github.css';
import { Notifications } from '../../app/notifications/client';
import { updateUserData } from '../lib/userData';

hljs.initHighlightingOnLoad();

if (window.DISABLE_ANIMATION) {
	toastr.options.timeOut = 1;
	toastr.options.showDuration = 0;
	toastr.options.hideDuration = 0;
	toastr.options.extendedTimeOut = 0;
}

const onUserEvents = {
	inserted: (_id, data) => Meteor.users.insert(data),
	updated: (_id, { diff }) => Meteor.users.upsert({ _id }, { $set: diff }),
	removed: (_id) => Meteor.users.remove({ _id }),
};

Meteor.startup(function() {
	TimeSync.loggingEnabled = false;

	Session.setDefault('AvatarRandom', 0);

	window.lastMessageWindow = {};
	window.lastMessageWindowHistory = {};

	let status = undefined;
	Tracker.autorun(async function() {
		const uid = Meteor.userId();
		if (!uid) {
			return;
		}

		await Notifications.onUser('userData', ({ type, id, ...data }) => onUserEvents[type](uid, data));

		const user = await updateUserData(uid);

		if (getUserPreference(user, 'enableAutoAway')) {
			const idleTimeLimit = getUserPreference(user, 'idleTimeLimit') || 300;
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
