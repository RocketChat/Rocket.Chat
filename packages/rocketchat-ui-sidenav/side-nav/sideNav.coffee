Template.sideNav.helpers
	flexTemplate: ->
		return SideNav.getFlex().template

	flexData: ->
		return SideNav.getFlex().data

	footer: ->
		return RocketChat.settings.get 'Layout_Sidenav_Footer'

	showStarredRooms: ->
		favoritesEnabled = RocketChat.settings.get 'Favorite_Rooms'
		hasFavoriteRoomOpened = ChatSubscription.findOne({ f: true, open: true })

		return true if favoritesEnabled and hasFavoriteRoomOpened

	roomType: ->
		return RocketChat.roomTypes.getTypes()

	canShowRoomType: ->
		return RocketChat.roomTypes.checkCondition(@)

	templateName: ->
		return @template

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
