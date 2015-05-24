Meteor.methods
	leaveRoom: (roomId) ->
		room = ChatRoom.findOne roomId

		update =
			$pull:
				uids: Meteor.userId()

		ChatSubscription.remove { rid: roomId, uid: Meteor.userId() }

		ChatRoom.update roomId, update
