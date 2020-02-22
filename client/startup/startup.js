import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';
import { Session } from 'meteor/session';
import { TimeSync } from 'meteor/mizzao:timesync';
import { UserPresence } from 'meteor/konecty:user-presence';
import { Accounts } from 'meteor/accounts-base';
import toastr from 'toastr';

import hljs from '../../app/markdown/lib/hljs';
import { fireGlobalEvent } from '../../app/ui-utils';
import { settings } from '../../app/settings';
import { Users } from '../../app/models';
import { getUserPreference, isMobile } from '../../app/utils';
import 'highlight.js/styles/github.css';
import { syncUserdata } from '../lib/userData';

hljs.initHighlightingOnLoad();

if (window.DISABLE_ANIMATION) {
	toastr.options.timeOut = 1;
	toastr.options.showDuration = 0;
	toastr.options.hideDuration = 0;
	toastr.options.extendedTimeOut = 0;
}

Meteor.startup(async function() {
	if (!isMobile()) {
		await import('../../app/livechat/client');
		await import('../../app/katex/client');
		await import('../../app/integrations/client');
		await import('../../app/apps/client');
	}


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
		if (!Meteor.status().connected) {
			return;
		}

		const user = await syncUserdata(uid);
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
