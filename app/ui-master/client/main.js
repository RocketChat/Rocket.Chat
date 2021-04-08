import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';
import { FlowRouter } from 'meteor/kadira:flow-router';
import { Session } from 'meteor/session';
import { Template } from 'meteor/templating';

import { getUserPreference } from '../../utils/client';
import { mainReady, Layout, iframeLogin, menu, fireGlobalEvent } from '../../ui-utils';
import { settings } from '../../settings';
import { CachedChatSubscription, Roles, Users } from '../../models';
import { CachedCollectionManager } from '../../ui-cached-collection';
import { hasRole } from '../../authorization';
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

Template.main.onCreated(function() {
	tooltip.init();
});

Template.main.helpers({
	removeSidenav() {
		return Layout.isEmbedded() && !/^\/admin/.test(FlowRouter.current().route.path);
	},
	siteName() {
		return settings.get('Site_Name');
	},
	logged() {
		if (Meteor.userId() != null || (settings.get('Accounts_AllowAnonymousRead') === true && Session.get('forceLogin') !== true)) {
			$('html').addClass('noscroll').removeClass('scroll');
			return true;
		}
		$('html').addClass('scroll').removeClass('noscroll');
		return false;
	},
	useIframe() {
		const iframeEnabled = typeof iframeLogin !== 'undefined';
		return iframeEnabled && iframeLogin.reactiveEnabled.get();
	},
	iframeUrl() {
		const iframeEnabled = typeof iframeLogin !== 'undefined';
		return iframeEnabled && iframeLogin.reactiveIframeUrl.get();
	},
	subsReady() {
		const subscriptionsReady = CachedChatSubscription.ready.get();
		const settingsReady = settings.cachedCollection.ready.get();
		const ready = !Meteor.userId() || (isSyncReady.get() && subscriptionsReady && settingsReady);

		CachedCollectionManager.syncEnabled = ready;
		mainReady.set(ready);

		return ready;
	},
	hasUsername() {
		const uid = Meteor.userId();
		const user = uid && Users.findOne({ _id: uid }, { fields: { username: 1 } });
		return (user && user.username) || (!uid && settings.get('Accounts_AllowAnonymousRead'));
	},
	requirePasswordChange() {
		const user = Meteor.user();
		return user && user.requirePasswordChange === true;
	},
	require2faSetup() {
		const user = Meteor.user();

		// User is already using 2fa
		if (!user || (user.services.totp !== undefined && user.services.totp.enabled) || (user.services.email2fa !== undefined && user.services.email2fa.enabled)) {
			return false;
		}

		const mandatoryRole = Roles.findOne({ _id: { $in: user.roles }, mandatory2fa: true });
		return mandatoryRole !== undefined;
	},
	CustomScriptLoggedOut() {
		const script = settings.get('Custom_Script_Logged_Out') || '';
		if (script.trim()) {
			executeCustomScript(script);
		}
	},
	CustomScriptLoggedIn() {
		const script = settings.get('Custom_Script_Logged_In') || '';
		if (script.trim()) {
			executeCustomScript(script);
		}
	},
	embeddedVersion() {
		if (Layout.isEmbedded()) {
			return 'embedded-view';
		}
	},
	showSetupWizard() {
		const userId = Meteor.userId();
		const Show_Setup_Wizard = settings.get('Show_Setup_Wizard');

		return (!userId && Show_Setup_Wizard === 'pending') || (userId && hasRole(userId, 'admin') && Show_Setup_Wizard === 'in_progress');
	},
	readReceiptsEnabled() {
		if (settings.get('Message_Read_Receipt_Store_Users')) {
			return 'read-receipts-enabled';
		}
	},
});

Template.main.events({
	'click div.burger'() {
		return menu.toggle();
	},
});

Template.main.onRendered(function() {
	return Tracker.autorun(function() {
		const userId = Meteor.userId();
		const Show_Setup_Wizard = settings.get('Show_Setup_Wizard');

		if ((!userId && Show_Setup_Wizard === 'pending') || (userId && hasRole(userId, 'admin') && Show_Setup_Wizard === 'in_progress')) {
			FlowRouter.go('setup-wizard');
		}
		if (getUserPreference(userId, 'hideUsernames')) {
			$(document.body).on('mouseleave', 'button.thumb', function() {
				return tooltip.hide();
			});
			return $(document.body).on('mouseenter', 'button.thumb', function(e) {
				const avatarElem = $(e.currentTarget);
				const username = avatarElem.attr('data-username');
				if (username) {
					e.stopPropagation();
					return tooltip.showElement($('<span>').text(username), avatarElem);
				}
			});
		}
		$(document.body).off('mouseenter', 'button.thumb');
		return $(document.body).off('mouseleave', 'button.thumb');
	});
});

Meteor.startup(function() {
	return fireGlobalEvent('startup', true);
});
