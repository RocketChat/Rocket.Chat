import { Meteor } from 'meteor/meteor';
import { FlowRouter } from 'meteor/kadira:flow-router';
import { Session } from 'meteor/session';
import { Template } from 'meteor/templating';

import { iframeLogin } from '../../ui-utils/client';
import { settings } from '../../settings';
import { Roles, Users } from '../../models';
import { isLayoutEmbedded } from '../../../client/lib/utils/isLayoutEmbedded';
import './main.html';

Template.main.helpers({
	removeSidenav: () => isLayoutEmbedded() && !/^\/admin/.test(FlowRouter.current().route.path),
	logged: () => {
		return !!Meteor.userId() || (settings.get('Accounts_AllowAnonymousRead') === true && Session.get('forceLogin') !== true);
	},
	useIframe: () => {
		return iframeLogin.reactiveEnabled.get();
	},
	iframeUrl: () => {
		return iframeLogin.reactiveIframeUrl.get();
	},
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
