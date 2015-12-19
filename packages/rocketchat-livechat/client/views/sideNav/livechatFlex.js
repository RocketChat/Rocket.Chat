Template.livechatFlex.helpers({
	active (route) {
		FlowRouter.watchPathChange();
		if (FlowRouter.current().route.name === route) {
			return 'active';
		}
	}
});

Template.livechatFlex.events({
	'mouseenter header' () {
		SideNav.overArrow()
	},

	'mouseleave header' () {
		SideNav.leaveArrow()
	},

	'click header' () {
		SideNav.closeFlex()
	}
});
