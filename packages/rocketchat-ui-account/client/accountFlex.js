import { Template } from 'meteor/templating';

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
		return RocketChat.settings.get('Accounts_AllowUserProfileChange');
	},
	accessTokensEnabled() {
		return RocketChat.authz.hasAllPermission(['create-personal-access-tokens']);
	},
	encryptionEnabled() {
		return RocketChat.settings.get('E2E_Enable');
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
		return RocketChat.Layout.isEmbedded();
	},
});
