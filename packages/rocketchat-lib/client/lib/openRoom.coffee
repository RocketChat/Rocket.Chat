currentTracker = undefined

@openRoom = (type, name) ->
	Session.set 'openedRoom', null

	Meteor.defer ->
		currentTracker = Tracker.autorun (c) ->
			if RoomManager.open(type + name).ready() isnt true
				BlazeLayout.render 'main', {center: 'loading'}
				return

			username = Meteor.user()?.username
			unless username
				return

			currentTracker = undefined
			c.stop()

			query =
				t: type
				name: name

			if type is 'd'
				delete query.name
				query.usernames =
					$all: [name, username]

			room = ChatRoom.findOne(query)
			if not room?
				if type is 'd'
					Meteor.call 'createDirectMessage', name, (err) ->
						if !err
							openRoom('d', name)
						else
							Session.set 'roomNotFound', {type: type, name: name}
							BlazeLayout.render 'main', {center: 'roomNotFound'}
							return
				else
					Session.set 'roomNotFound', {type: type, name: name}
					BlazeLayout.render 'main', {center: 'roomNotFound'}
				return

			$('.rocket-loader').remove();
			mainNode = document.querySelector('.main-content')
			if mainNode?
				for child in mainNode.children
					mainNode.removeChild child if child?
				roomDom = RoomManager.getDomOfRoom(type + name, room._id)
				mainNode.appendChild roomDom
				if roomDom.classList.contains('room-container')
					roomDom.querySelector('.messages-box > .wrapper').scrollTop = roomDom.oldScrollTop

			Session.set 'openedRoom', room._id

			Session.set 'editRoomTitle', false
			RoomManager.updateMentionsMarksOfRoom type + name
			Meteor.setTimeout ->
				readMessage.readNow()
			, 2000
			# KonchatNotification.removeRoomNotification(params._id)

			if Meteor.Device.isDesktop()
				setTimeout ->
					$('.message-form .input-message').focus()
				, 100

			# update user's room subscription
			sub = ChatSubscription.findOne({rid: room._id})
			if sub?.open is false
				Meteor.call 'openRoom', room._id, (err) ->
					if err
						return handleError(err)

			if FlowRouter.getQueryParam('msg')
				msg = { _id: FlowRouter.getQueryParam('msg'), rid: room._id }
				RoomHistoryManager.getSurroundingMessages(msg);

			RocketChat.callbacks.run 'enter-room', sub
