Router.route '/room/:_id',
	name: 'room'
	action: ->
		Session.set('editRoomTitle', false)
		@render 'room',
			data:
				_id: @params._id

	waitOn: ->
		if Meteor.userId()
			RoomManager.open @params._id

	onBeforeAction: ->
		if not ChatRoom.find(@params._id).count()
			Router.go 'home'

		Session.set 'openedRoom', @params._id

		this.next()
	# 	Meteor.call 'readMessages', @params._id
	# 	KonchatNotification.removeRoomNotification @params._id

	onAfterAction: ->
		setTimeout ->
			$('.message-form .input-message').focus()
			$('.messages-box .wrapper').scrollTop(99999)
		, 100

	# action: ->

	# 	self = this
	# 	Session.set('editRoomTitle', false)
	# 	Meteor.call 'readMessages', self.params._id
	# 	Tracker.nonreactive ->
	# 		KonchatNotification.removeRoomNotification(self.params._id)
	# 		self.render 'room',
	# 			data:
	# 				_id: self.params._id

