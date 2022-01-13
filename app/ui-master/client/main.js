import { Meteor } from 'meteor/meteor';
import { FlowRouter } from 'meteor/kadira:flow-router';
import { Session } from 'meteor/session';
import { Template } from 'meteor/templating';

import { getUserPreference } from '../../utils/client';
import { mainReady, iframeLogin } from '../../ui-utils/client';
import { settings } from '../../settings';
import { CachedChatSubscription, Roles, Users } from '../../models';
import { CachedCollectionManager } from '../../ui-cached-collection';
import { tooltip } from '../../ui/client/components/tooltip';
import { isSyncReady } from '../../../client/lib/userData';
import { fireGlobalEvent } from '../../../client/lib/utils/fireGlobalEvent';
import { isLayoutEmbedded } from '../../../client/lib/utils/isLayoutEmbedded';
import { isIOsDevice } from '../../../client/lib/utils/isIOsDevice';
import './main.html';

const subsReady = () => {
	const subscriptionsReady = CachedChatSubscription.ready.get();
	const settingsReady = settings.cachedCollection.ready.get();
	const ready = !Meteor.userId() || (isSyncReady.get() && subscriptionsReady && settingsReady);

	CachedCollectionManager.syncEnabled = ready;
	mainReady.set(ready);

	return ready;
};

const logged = () => {
	if (!!Meteor.userId() || (settings.get('Accounts_AllowAnonymousRead') === true && Session.get('forceLogin') !== true)) {
		document.documentElement.classList.add('noscroll');
		document.documentElement.classList.remove('scroll');
		return true;
	}

	document.documentElement.classList.add('scroll');
	document.documentElement.classList.remove('noscroll');
	return false;
};

Template.main.helpers({
	removeSidenav: () => isLayoutEmbedded() && !/^\/admin/.test(FlowRouter.current().route.path),
	logged,
	useIframe: () => {
		return iframeLogin.reactiveEnabled.get();
	},
	iframeUrl: () => {
		return iframeLogin.reactiveIframeUrl.get();
	},
	subsReady,
	hasUsername: () => {
		const uid = Meteor.userId();

		if (!uid) {
			return settings.get('Accounts_AllowAnonymousRead');
		}

		const user = uid && Users.findOne({ _id: uid }, { fields: { username: 1 } });
		return user?.username ?? false;
	},
	requirePasswordChange: () => {
		return Meteor.user()?.requirePasswordChange === true;
	},
	require2faSetup: () => {
		const user = Meteor.user();

		// User is already using 2fa
		if (
			!user ||
			(user.services.totp !== undefined && user.services.totp.enabled) ||
			(user.services.email2fa !== undefined && user.services.email2fa.enabled)
		) {
			return false;
		}
		const is2faEnabled = settings.get('Accounts_TwoFactorAuthentication_Enabled');

		const mandatoryRole = Roles.findOne({ _id: { $in: user.roles }, mandatory2fa: true });
		return mandatoryRole !== undefined && is2faEnabled;
	},
	embeddedVersion: () => {
		if (isLayoutEmbedded()) {
			return 'embedded-view';
		}
	},
	readReceiptsEnabled: () => {
		if (settings.get('Message_Read_Receipt_Store_Users')) {
			return 'read-receipts-enabled';
		}
	},
});

Template.main.onCreated(function () {
	tooltip.init();

	this.autorun(() => {
		if (!subsReady()) {
			return;
		}

		if (logged()) {
			fireGlobalEvent('Custom_Script_Logged_In');
			return;
		}

		fireGlobalEvent('Custom_Script_Logged_Out');
	});
});

Template.main.onRendered(function () {
	// iOS prevent click if elements matches hover
	if (isIOsDevice && window.matchMedia('(hover: none)').matches) {
		$(document.body).on('touchend', 'a', (e) => {
			if (!e.target.matches(':hover')) {
				return;
			}

			e.target.click();
		});
	}

	this.autorun(() => {
		const userId = Meteor.userId();

		const handleMouseEnter = (e) => {
			const avatarElem = $(e.currentTarget);
			const username = avatarElem.attr('data-username');
			if (username) {
				e.stopPropagation();
				tooltip.showElement($('<span>').text(username), avatarElem);
			}
		};

		const handleMouseLeave = () => {
			tooltip.hide();
		};

		if (getUserPreference(userId, 'hideUsernames')) {
			$(document.body).on('mouseenter', 'button.thumb', handleMouseEnter);
			$(document.body).on('mouseleave', 'button.thumb', handleMouseLeave);
			return;
		}

		$(document.body).off('mouseenter', 'button.thumb', handleMouseEnter);
		$(document.body).off('mouseleave', 'button.thumb', handleMouseLeave);
	});
});
