import { Template } from 'meteor/templating';

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
	showSecurityMenu() {
		return settings.get('UI_Display_Security');
	},
	showPersonalAccessTokensMenu() {
		return hasAllPermission(['create-personal-access-tokens']) && settings.get('UI_Display_Personal_Access_Tokens');
	},
	showIntegrationsMenu() {
		return settings.get('Webdav_Integration_Enabled') && settings.get('UI_Display_Integrations');
	},

});
