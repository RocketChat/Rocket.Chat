Template.livechatFlex.helpers({
	menuItem(name, icon, section) {
		return {
			name: t(name),
			icon,
			pathSection: section,
			darken: true
		};
	}
});

Template.livechatFlex.events({
	'click [data-action="back"]'() {
		SideNav.closeFlex();
	}
});
