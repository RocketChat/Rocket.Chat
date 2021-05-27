import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';
import { FlowRouter } from 'meteor/kadira:flow-router';
import { Session } from 'meteor/session';
import { Template } from 'meteor/templating';

import { getUserPreference } from '../../utils/client';
import { mainReady, Layout, iframeLogin } from '../../ui-utils';
import { settings } from '../../settings';
import { CachedChatSubscription, Roles, Users } from '../../models';
import { CachedCollectionManager } from '../../ui-cached-collection';
import { tooltip } from '../../ui/client/components/tooltip';
import { callbacks } from '../../callbacks/client';
import { isSyncReady } from '../../../client/lib/userData';

import './main.html';

function executeCustomScript(script) {
	eval(script);//eslint-disable-line
}

function customScriptsOnLogout() {
	const script = settings.get('Custom_Script_On_Logout') || '';
	if (script.trim()) {
		executeCustomScript(script);
	}
}

callbacks.add('afterLogoutCleanUp', () => customScriptsOnLogout(), callbacks.priority.LOW, 'custom-script-on-logout');

Template.main.helpers({
	removeSidenav: () => Layout.isEmbedded() && !/^\/admin/.test(FlowRouter.current().route.path),
	logged: () => {
		if (!!Meteor.userId() || (settings.get('Accounts_AllowAnonymousRead') === true && Session.get('forceLogin') !== true)) {
			document.documentElement.classList.add('noscroll');
			document.documentElement.classList.remove('scroll');
			return true;
		}

		document.documentElement.classList.add('scroll');
		document.documentElement.classList.remove('noscroll');
		return false;
	},
	useIframe: () => {
		const iframeEnabled = typeof iframeLogin !== 'undefined';
		return iframeEnabled && iframeLogin.reactiveEnabled.get();
	},
	iframeUrl: () => {
		const iframeEnabled = typeof iframeLogin !== 'undefined';
		return iframeEnabled && iframeLogin.reactiveIframeUrl.get();
	},
	subsReady: () => {
		const subscriptionsReady = CachedChatSubscription.ready.get();
		const settingsReady = settings.cachedCollection.ready.get();
		const ready = !Meteor.userId() || (isSyncReady.get() && subscriptionsReady && settingsReady);

		CachedCollectionManager.syncEnabled = ready;
		mainReady.set(ready);

		return ready;
	},
	hasUsername: () => {
		const uid = Meteor.userId();
		const user = uid && Users.findOne({ _id: uid }, { fields: { username: 1 } });
		return (user && user.username) || (!uid && settings.get('Accounts_AllowAnonymousRead'));
	},
	requirePasswordChange: () => {
		const user = Meteor.user();
		return user && user.requirePasswordChange === true;
	},
	require2faSetup: () => {
		const user = Meteor.user();

		// User is already using 2fa
		if (!user || (user.services.totp !== undefined && user.services.totp.enabled) || (user.services.email2fa !== undefined && user.services.email2fa.enabled)) {
			return false;
		}
		const is2faEnabled = settings.get('Accounts_TwoFactorAuthentication_Enabled');

		const mandatoryRole = Roles.findOne({ _id: { $in: user.roles }, mandatory2fa: true });
		return mandatoryRole !== undefined && is2faEnabled;
	},
	CustomScriptLoggedOut: () => {
		const script = settings.get('Custom_Script_Logged_Out') || '';
		if (script.trim()) {
			executeCustomScript(script);
		}
	},
	CustomScriptLoggedIn: () => {
		const script = settings.get('Custom_Script_Logged_In') || '';
		if (script.trim()) {
			executeCustomScript(script);
		}
	},
	embeddedVersion: () => {
		if (Layout.isEmbedded()) {
			return 'embedded-view';
		}
	},
	readReceiptsEnabled: () => {
		if (settings.get('Message_Read_Receipt_Store_Users')) {
			return 'read-receipts-enabled';
		}
	},
});

Template.main.onCreated(function() {
	tooltip.init();
});

Template.main.onRendered(function() {
	Tracker.autorun(function() {
		const userId = Meteor.userId();

		if (getUserPreference(userId, 'hideUsernames')) {
			$(document.body).on('mouseenter', 'button.thumb', (e) => {
				const avatarElem = $(e.currentTarget);
				const username = avatarElem.attr('data-username');
				if (username) {
					e.stopPropagation();
					tooltip.showElement($('<span>').text(username), avatarElem);
				}
			});

			$(document.body).on('mouseleave', 'button.thumb', () => {
				tooltip.hide();
			});

			return;
		}

		$(document.body).off('mouseenter', 'button.thumb');
		$(document.body).off('mouseleave', 'button.thumb');
	});
});
