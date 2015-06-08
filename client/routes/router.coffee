Router.configure
	progress : true
	loadingTemplate: 'loading'
	notFoundTemplate: 'error'

	waitOn: ->
		if Meteor.userId()
			return [Meteor.subscribe('userData'), RoomManager.init()]

	onBeforeAction: ->
		Session.setDefault('flexOpened', false)
		Session.set('openedRoom', null)
		this.next()

	onAfterAction: ->
		unless Router._layout._template is 'appLayout'
			Router.configure
				layoutTemplate: 'appLayout'

Router.onBeforeAction ->
	if not Meteor.userId()
		this.layout('loginLayout')
		this.render('loginForm')
	else
		this.next()

Router.onBeforeAction ->
	if Meteor.userId()? and not Meteor.user().username?
		this.layout('usernameLayout')
		return this.render('usernamePrompt')

	if Meteor.userId()? and not Meteor.user().avatarOrigin?
		this.layout('usernameLayout')
		return this.render('avatarPrompt')

	this.next()
, {
	except: ['login']
}

Router.route '/',
	name: 'index'

	onBeforeAction: ->
		if Meteor.userId()
			Router.go 'home'
		else
			Router.go 'login'


Router.route '/login',
	name: 'login'

	onBeforeAction: ->
		if Meteor.userId()
			Router.go 'home'


Router.route '/home',
	name: 'home'

	action: ->
		this.render('home')

	onAfterAction: ->
		KonchatNotification.getDesktopPermission()


Router.route '/room/:_id',
	name: 'room'

	waitOn: ->
		RoomManager.open @params._id

	onBeforeAction: ->
		unless ChatRoom.find(@params._id).count()
			Router.go 'home'

		Session.set('openedRoom', this.params._id)
		Session.set('showUserInfo', null)

		this.next()

	action: ->

		self = this
		Session.set('editRoomTitle', false)
		Meteor.call 'readMessages', self.params._id
		Tracker.nonreactive ->
			KonchatNotification.removeRoomNotification(self.params._id)
			self.render 'chatWindowDashboard',
				data:
					_id: self.params._id

	onAfterAction: ->
		setTimeout ->
			$('.message-form .input-message').focus()
			$('.messages-box .wrapper').scrollTop(99999)
		, 100


Router.route '/history/private',
	name: 'privateHistory'

	action: ->
		Session.setDefault('historyFilter', '')
		this.render 'privateHistory'

	waitOn: ->
		return [ Meteor.subscribe('privateHistory') ]
