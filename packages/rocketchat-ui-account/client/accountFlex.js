/*globals menu */
Template.accountFlex.events({
	'mouseenter header'() {
		return SideNav.overArrow();
	},
	'mouseleave header'() {
		return SideNav.leaveArrow();
	},
	'click header'() {
		return SideNav.closeFlex();
	},
	'click .cancel-settings'() {
		return SideNav.closeFlex();
	},
	'click .account-link'() {
		return menu.close();
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
