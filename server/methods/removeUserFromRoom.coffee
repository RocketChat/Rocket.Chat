Meteor.methods
	removeUserFromRoom: (data) ->
		fromId = Meteor.userId()
		# console.log '[methods] removeUserFromRoom -> '.green, 'fromId:', fromId, 'data:', data

		room = ChatRoom.findOne data.rid

		if room.uid isnt Meteor.userId() and room.t is 'c'
			throw new Meteor.Error 403, 'Not allowed'

		update =
			$pull:
				uids: data.uid

		removedUser = Meteor.users.findOne data.uid

		ChatRoom.update data.rid, update

		ChatSubscription.remove { uid: data.uid, rid: data.rid }

		ChatMessage.insert
			rid: data.rid
			ts: (new Date)
			t: 'ru'
			msg: removedUser.name
			by: Meteor.userId()

		return true
