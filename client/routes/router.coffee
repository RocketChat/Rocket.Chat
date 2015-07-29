Blaze.registerHelper 'pathFor', (path, kw) ->
	return FlowRouter.path path, kw.hash

BlazeLayout.setRoot 'body'


FlowRouter.subscriptions = ->
	Tracker.autorun =>
		RoomManager.init()
		if Meteor.userId()?
			@register 'userData', Meteor.subscribe('userData')
			@register 'activeUsers', Meteor.subscribe('activeUsers')
			if Meteor.user()?.admin
				@register 'admin-settings', Meteor.subscribe('admin-settings')


FlowRouter.route '/',
	name: 'index'

	action: ->
		FlowRouter.go 'home'


FlowRouter.route '/login',
	name: 'login'

	action: ->
		FlowRouter.go 'home'


FlowRouter.route '/home',
	name: 'home'

	action: ->
		BlazeLayout.render 'main', {center: 'home'}
		KonchatNotification.getDesktopPermission()

FlowRouter.route '/changeavatar',
	name: 'changeAvatar'

	action: ->
		BlazeLayout.render 'main', {center: 'avatarPrompt'}

FlowRouter.route '/settings/:group?',
	name: 'settings'

	action: ->
		BlazeLayout.render 'main', {center: 'settings'}

FlowRouter.route '/history/private',
	name: 'privateHistory'

	subscriptions: (params, queryParams) ->
		@register 'privateHistory', Meteor.subscribe('privateHistory')

	action: ->
		Session.setDefault('historyFilter', '')
		BlazeLayout.render 'main', {center: 'privateHistory'}
