Template.sideNav.helpers

	flexTemplate: ->
		return SideNav.getFlex().template
	flexData: ->
		return SideNav.getFlex().data
	footer: ->
		return RocketChat.settings.get 'Layout_Sidenav_Footer'
	showStarredRooms: ->
		return !RocketChat.settings.get 'Disable_Favorite_Rooms'

Template.sideNav.events
	'click .close-flex': ->
		SideNav.closeFlex()

	'click .arrow': ->
		SideNav.toggleCurrent()

	'mouseenter .header': ->
		SideNav.overArrow()

	'mouseleave .header': ->
		SideNav.leaveArrow()

	'scroll .rooms-list': ->
		menu.updateUnreadBars()

Template.sideNav.onRendered ->
	SideNav.init()
	menu.init()

	Meteor.defer ->
		menu.updateUnreadBars()
