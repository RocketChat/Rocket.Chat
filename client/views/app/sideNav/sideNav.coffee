Template.sideNav.helpers
	flexTemplate: ->
		return SideNav.getFlex().template

	flexData: ->
		return SideNav.getFlex().data

	footer: ->
		return RocketChat.settings.get 'Layout_Sidenav_Footer'

	showStarredRooms: ->
		favoritesEnabled = !RocketChat.settings.get 'Disable_Favorite_Rooms'
		hasFavoriteRoomOpened = ChatSubscription.findOne({ f: true, open: true })

		return true if favoritesEnabled and hasFavoriteRoomOpened

	myUserInfo: ->
		visualStatus = "online"
		username = Meteor.user()?.username
		switch Session.get('user_' + username + '_status')
			when "away"
				visualStatus = t("away")
			when "busy"
				visualStatus = t("busy")
			when "offline"
				visualStatus = t("invisible")
		return {
			name: Session.get('user_' + username + '_name')
			status: Session.get('user_' + username + '_status')
			visualStatus: visualStatus
			_id: Meteor.userId()
			username: username
		}

	showAdminOption: ->
		return RocketChat.authz.hasAtLeastOnePermission( ['view-statistics', 'view-room-administration', 'view-user-administration', 'view-privileged-setting'])

	registeredMenus: ->
		return AccountBox.getOptions()

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

	'click .options .status': (event) ->
		event.preventDefault()
		AccountBox.setStatus(event.currentTarget.dataset.status)

	'click .account-box': (event) ->
		AccountBox.toggle()

	'click #logout': (event) ->
		event.preventDefault()
		user = Meteor.user()
		Meteor.logout ->
			FlowRouter.go 'home'
			Meteor.call('logoutCleanUp', user)

	'click #avatar': (event) ->
		FlowRouter.go 'changeAvatar'

	'click #account': (event) ->
		SideNav.setFlex "accountFlex"
		SideNav.openFlex()
		FlowRouter.go 'account'

	'click #admin': ->
		SideNav.setFlex "adminFlex"
		SideNav.openFlex()

	'click .account-link': ->
		menu.close()

Template.sideNav.onRendered ->
	SideNav.init()
	menu.init()

	Meteor.defer ->
		menu.updateUnreadBars()

	AccountBox.init()

	wrapper = $('.rooms-list .wrapper').get(0)
	lastLink = $('.rooms-list h3').get(0)

	RocketChat.roomTypes.getTypes().forEach (roomType) ->
		if RocketChat.authz.hasRole(Meteor.userId(), roomType.roles) && Template[roomType.template]?
			Blaze.render Template[roomType.template], wrapper, lastLink
