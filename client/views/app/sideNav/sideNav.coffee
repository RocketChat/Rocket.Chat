Template.sideNav.helpers
	isAdmin: ->
		return Meteor.user()?.admin is true
	flexTemplate: ->
		return SideNav.getFlex().template
	flexData: ->
		return SideNav.getFlex().data
	footer: ->
		return RocketChat.settings.get 'Layout_Sidenav_Footer'

Template.sideNav.events
	'click .close-flex': ->
		SideNav.closeFlex()

	'click .arrow': ->
		SideNav.toggleCurrent()

	'mouseenter .header': ->
		SideNav.overArrow()

	'mouseleave .header': ->
		SideNav.leaveArrow()

Template.sideNav.onRendered ->
	SideNav.init()
	menu.init()
