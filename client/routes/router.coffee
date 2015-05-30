Router.configure
	progress : true
	loadingTemplate: 'loading'
	notFoundTemplate: 'roomNotFound'
	waitOn: ->
		return [Meteor.subscribe('userData'), RoomManager.init()]
	onBeforeAction: ->
		Session.set('flexOpened', false)
		Session.set('openedRoom', null)

		this.next()
	onAfterAction: ->
		unless Router._layout._template is 'appLayout'
			Router.configure
				layoutTemplate: 'appLayout'

Router.onBeforeAction ->
	if not Meteor.userId()
		this.layout('loginLayout')
		return this.render('loginIntro')

	if not Meteor.user().username?
		this.layout('usernameLayout')
		return this.render('usernamePrompt')

	this.next()
, {
	except: ['login']
}

Router.route '/',
	name: 'index'
	action: ->
		this.render('home')

	onAfterAction: ->
		KonchatNotification.getDesktopPermission()

Router.route '/login',
	name: 'login'
	action: ->
		this.layout('loginLayout')
		return this.render('loginForm')

Router.route '/room/:_id',
	name: 'room'
	waitOn: ->
		return RoomManager.open @params._id
	onBeforeAction: ->
		unless Meteor.userId()?
			return Router.go 'index'

		Session.set('flexOpened', true)
		Session.set('openedRoom', this.params._id)

		# zera a showUserInfo pra garantir que vai estar com a listagem do grupo aberta
		Session.set('showUserInfo', null)

		#correção temporária para a versão mobile
		if Modernizr.touch
			Session.set('flexOpened', false)

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
	onBeforeAction: ->
		unless Meteor.userId()?
			return Router.go 'index'

		this.next()
	action: ->
		Session.setDefault('historyFilter', '')
		this.render 'privateHistory'
	waitOn: ->
		return [ Meteor.subscribe('privateHistoryRooms') ]
