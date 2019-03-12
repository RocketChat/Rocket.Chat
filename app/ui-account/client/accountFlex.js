import { Template } from 'meteor/templating';
import { settings } from '/app/settings';
import { hasAllPermission } from '/app/authorization';
import { SideNav, Layout } from '/app/ui-utils';
import { t } from '/app/utils';

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
	encryptionEnabled() {
		return settings.get('E2E_Enable');
	},
	webdavIntegrationEnabled() {
		return settings.get('Webdav_Integration_Enabled');
	},
	menuItem(name, icon, section, group) {
		return {
			name: t(name),
			icon,
			pathSection: section,
			pathGroup: group,
			darken: true,
		};
	},
	embeddedVersion() {
		return Layout.isEmbedded();
	},
});
