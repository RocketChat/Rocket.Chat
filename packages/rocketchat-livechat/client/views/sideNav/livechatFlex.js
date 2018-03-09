Template.livechatFlex.helpers({
	menuItem(name, icon, section) {
		return {
			name: t(name),
			icon,
			pathSection: section,
			darken: true
		};
	},
	embeddedVersion() {
		return RocketChat.Layout.isEmbedded();
	}
});

Template.livechatFlex.events({
	'click [data-action="close"]'() {
		SideNav.closeFlex();
	}
});
