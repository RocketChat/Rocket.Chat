Blaze.registerHelper 'pathFor', (path, kw) ->
	return FlowRouter.path path, kw.hash

FlowLayout.setRoot 'body'


FlowRouter.subscriptions = ->
	Tracker.autorun =>
		RoomManager.init()
		if Meteor.userId()?
			@register 'userData', Meteor.subscribe('userData')
			@register 'activeUsers', Meteor.subscribe('activeUsers')


FlowRouter.route '/',
	name: 'index'

	action: ->
		FlowRouter.go 'home'


FlowRouter.route '/home',
	name: 'home'

	action: ->
		FlowLayout.render 'main', {center: 'home'}
		KonchatNotification.getDesktopPermission()


FlowRouter.route '/settings/:group?',
	name: 'settings'

	subscriptions: (params, queryParams) ->
		@register 'admin-settings', Meteor.subscribe('admin-settings')

	action: ->
		FlowLayout.render 'main', {}

		track = Tracker.autorun ->
			if not FlowRouter.subsReady()
				return

			track?.stop()

			if not Meteor.user()? or Meteor.user().admin isnt true
				FlowRouter.go('home')
				return

			FlowLayout.render 'main', {center: 'settings'}
			KonchatNotification.getDesktopPermission()


FlowRouter.route '/room/:_id',
	name: 'room'

	action: (params, queryParams) ->
		Session.set 'openedRoom', null
		FlowLayout.render 'main', {center: 'room'}

		track = Tracker.autorun ->
			if not FlowRouter.subsReady() or not Meteor.userId()? or RoomManager.open(params._id).ready() isnt true
				return

			if not ChatRoom.find(params._id).count()
				FlowRouter.go 'home'

			Session.set 'openedRoom', params._id

			Session.set 'editRoomTitle', false
			Meteor.call 'readMessages', params._id
			KonchatNotification.removeRoomNotification(params._id)

			setTimeout ->
				$('.message-form .input-message').focus()
			, 100


FlowRouter.route '/history/private',
	name: 'privateHistory'

	subscriptions: (params, queryParams) ->
		@register 'privateHistory', Meteor.subscribe('privateHistory')

	action: ->
		Session.setDefault('historyFilter', '')
		FlowLayout.render 'main', {center: 'privateHistory'}
