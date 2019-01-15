import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';
import { Session } from 'meteor/session';
import { TimeSync } from 'meteor/mizzao:timesync';
import { UserPresence } from 'meteor/konecty:user-presence';
import { fireGlobalEvent } from 'meteor/rocketchat:ui';
import toastr from 'toastr';
import hljs from 'highlight.js';
import 'highlight.js/styles/github.css';

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

	Tracker.autorun(function(computation) {
		if (!Meteor.userId() && !RocketChat.settings.get('Accounts_AllowAnonymousRead')) {
			return;
		}
		Meteor.subscribe('userData');
		computation.stop();
	});

	let status = undefined;
	Tracker.autorun(function() {
		const uid = Meteor.userId();
		if (!uid) {
			return;
		}
		const user = RocketChat.models.Users.findOne(uid, {
			fields: {
				status: 1,
				'settings.preferences.idleTimeLimit': 1,
				'settings.preferences.enableAutoAway': 1,
			},
		});

		if (!user) {
			return;
		}

		if (RocketChat.getUserPreference(user, 'enableAutoAway')) {
			const idleTimeLimit = RocketChat.getUserPreference(user, 'idleTimeLimit') || 300;
			UserPresence.awayTime = idleTimeLimit * 1000;
		} else {
			UserPresence.awayTime = 0;
			UserPresence.stopTimer();
		}

		UserPresence.start();

		if (user.status !== status) {
			status = user.status;
			fireGlobalEvent('status-changed', status);
		}
	});
});
