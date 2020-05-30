import { Template } from 'meteor/templating';
import { FlowRouter } from 'meteor/kadira:flow-router';

import { settings } from '../../settings';
import { hasAllPermission } from '../../authorization';
import { SideNav, Layout } from '../../ui-utils';
import { t } from '../../utils';

Template.accountFlex.events({
	'click [data-action="close"]'() {
		SideNav.closeFlex();
	},
});

// Template.accountFlex.onRendered(function() {
// 	$(this.find('.rooms-list')).perfectScrollbar();
// });

Template.accountFlex.helpers({
	allowUserProfileChange() {
		return settings.get('Accounts_AllowUserProfileChange');
	},
	accessTokensEnabled() {
		return hasAllPermission(['create-personal-access-tokens']);
	},
	twoFactorEnabled() {
		return settings.get('Accounts_TwoFactorAuthentication_Enabled');
	},
	encryptionEnabled() {
		return settings.get('E2E_Enable');
	},
	webdavIntegrationEnabled() {
		return settings.get('Webdav_Integration_Enabled');
	},
	menuItem(name, icon, section, group) {
		const routeParam = FlowRouter.getParam('group');
		return {
			name: t(name),
			icon,
			pathSection: section,
			pathGroup: group,
			darken: true,
			active: group === routeParam,
		};
	},
	embeddedVersion() {
		return Layout.isEmbedded();
	},
});
