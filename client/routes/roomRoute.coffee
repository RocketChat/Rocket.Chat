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
			# Meteor.call 'readMessages', params._id
			# KonchatNotification.removeRoomNotification(params._id)

			setTimeout ->
				$('.message-form .input-message').focus()
			, 100
