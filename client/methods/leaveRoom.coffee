Meteor.methods
	leaveRoom: (roomId) ->
		room = ChatRoom.findOne roomId

		update =
			$pull:
				usernames: Meteor.user().username

		ChatSubscription.remove { rid: roomId, 'u._id': Meteor.userId() }

		ChatRoom.update roomId, update
