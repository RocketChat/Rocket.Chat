Template.listPrivateGroupsFlex.helpers
	groups: ->
    return ChatSubscription.find { t: { $in: ['p']}, f: { $ne: true }, archived: { $ne: true } }, { sort: 't': 1, 'name': 1 }

Template.listPrivateGroupsFlex.events
	'click header': ->
		SideNav.closeFlex()

	'click .channel-link': ->
		SideNav.closeFlex()

	'click footer .create': ->
		SideNav.setFlex "privateGroupsFlex"

	'mouseenter header': ->
		SideNav.overArrow()

	'mouseleave header': ->
		SideNav.leaveArrow()
