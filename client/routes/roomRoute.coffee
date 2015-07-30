FlowRouter.route '/room/:_id',
	name: 'room'

	action: (params, queryParams) ->
		Session.set 'openedRoom', null

		BlazeLayout.render 'main', {center: 'loading'}

		Meteor.defer ->
			track = Tracker.autorun ->
				if RoomManager.open(params._id).ready() isnt true
					return

				track?.stop()

				if not ChatRoom.find(params._id).count()
					FlowRouter.go 'home'

				mainNode = document.querySelector('.main-content')
				if mainNode?
					for child in mainNode.children
						mainNode.removeChild child if child?
					room = RoomManager.getDomOfRoom(params._id)
					mainNode.appendChild room
					if room.classList.contains('room-container')
						room.querySelector('.messages-box > .wrapper').scrollTop = room.oldScrollTop

				Session.set 'openedRoom', params._id

				Session.set 'editRoomTitle', false
				Meteor.call 'readMessages', params._id if Meteor.userId()?
				# KonchatNotification.removeRoomNotification(params._id)

				setTimeout ->
					$('.message-form .input-message').focus()
				, 100

	triggersExit: [
		->
			mainNode = document.querySelector('.main-content')
			if mainNode?
				for child in mainNode.children
					if child?
						if child.classList.contains('room-container')
							child.oldScrollTop = child.querySelector('.messages-box > .wrapper').scrollTop
						mainNode.removeChild child
	]
