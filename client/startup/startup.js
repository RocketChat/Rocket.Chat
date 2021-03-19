import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';
import { Session } from 'meteor/session';
import { TimeSync } from 'meteor/mizzao:timesync';
import { UserPresence } from 'meteor/konecty:user-presence';
import { Accounts } from 'meteor/accounts-base';
import toastr from 'toastr';


import hljs from '../../app/markdown/lib/hljs';
import { fireGlobalEvent } from '../../app/ui-utils';
import { getUserPreference, t } from '../../app/utils';
import { hasPermission } from '../../app/authorization/client';
import 'highlight.js/styles/github.css';
import { synchronizeUserData } from '../lib/userData';
import * as banners from '../lib/banners';

hljs.initHighlightingOnLoad();

if (window.DISABLE_ANIMATION) {
	toastr.options.timeOut = 1;
	toastr.options.showDuration = 0;
	toastr.options.hideDuration = 0;
	toastr.options.extendedTimeOut = 0;
}

Meteor.startup(function() {
	Accounts.onLogout(() => Session.set('openedRoom', null));

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

		const user = await synchronizeUserData(uid);
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

	const autoRunHandler = Tracker.autorun(async function() {
		const uid = Meteor.userId();
		if (!uid) {
			return;
		}

		if (!hasPermission('manage-cloud')) {
			return;
		}

		Meteor.call('cloud:checkRegisterStatus', (err, data) => {
			if (err) {
				console.log(err);
				return;
			}

			autoRunHandler.stop();
			const { connectToCloud = false, workspaceRegistered = false } = data;
			if (connectToCloud === true && workspaceRegistered !== true) {
				banners.open({
					id: 'cloud-registration',
					title: t('Cloud_registration_pending_title'),
					html: t('Cloud_registration_pending_html'),
					modifiers: ['large', 'danger'],
				});
			}
		});
	});
});
