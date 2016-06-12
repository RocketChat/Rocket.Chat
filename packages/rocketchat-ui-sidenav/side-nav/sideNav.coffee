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
		if RocketChat.settings.get('UI_Merge_Channels_Groups')
			return RocketChat.roomTypes.checkCondition(@) and @template isnt 'privateGroups'
		else
			return RocketChat.roomTypes.checkCondition(@)

	templateName: ->
		if RocketChat.settings.get('UI_Merge_Channels_Groups')
			return if @template is 'channels' then 'combined' else @template
		else
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
