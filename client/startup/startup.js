import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';
import { Session } from 'meteor/session';
import { TimeSync } from 'meteor/mizzao:timesync';
import { UserPresence } from 'meteor/konecty:user-presence';
import toastr from 'toastr';
import hljs from 'highlight.js';

import { fireGlobalEvent } from '../../app/ui-utils';
import { Users } from '../../app/models';
import { getUserPreference } from '../../app/utils';
import 'highlight.js/styles/github.css';
import { Notifications } from '../../app/notifications/client';

hljs.initHighlightingOnLoad();

if (window.DISABLE_ANIMATION) {
	toastr.options.timeOut = 1;
	toastr.options.showDuration = 0;
	toastr.options.hideDuration = 0;
	toastr.options.extendedTimeOut = 0;
}

Meteor.startup(function() {
	TimeSync.loggingEnabled = false;

	Session.setDefault('AvatarRandom', 0);

	window.lastMessageWindow = {};
	window.lastMessageWindowHistory = {};

	Notifications.onUser('userData', ({ type, user }) => {
		const events = {
			changed: () => Meteor.users.upsert({ _id: user._id }, user),
			removed: () => Meteor.users.remove({ _id: user._id }),
		};
		events[type]();
	});

	let status = undefined;
	Tracker.autorun(function() {
		if (!Meteor.userId()) {
			return;
		}

		const user = Users.findOne(Meteor.userId(), {
			fields: {
				status: 1,
				'settings.preferences.idleTimeLimit': 1,
				'settings.preferences.enableAutoAway': 1,
			},
		});

		if (!user) {
			return;
		}

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
