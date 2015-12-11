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
})
