/*globals menu */
Template.accountFlex.events({
	'mouseenter header'() {
		SideNav.overArrow();
	},
	'mouseleave header'() {
		SideNav.leaveArrow();
	},
	'click [data-action="back"]'() {
		SideNav.closeFlex();
	},
	'click .cancel-settings'() {
		SideNav.closeFlex();
	},
	'click .account-link'() {
		menu.close();
	}
});

Template.accountFlex.helpers({
	allowUserProfileChange() {
		return RocketChat.settings.get('Accounts_AllowUserProfileChange');
	},
	allowUserAvatarChange() {
		return RocketChat.settings.get('Accounts_AllowUserAvatarChange');
	}
});
