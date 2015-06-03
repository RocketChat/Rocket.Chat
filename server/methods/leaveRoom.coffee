Meteor.methods
	leaveRoom: (roomId) ->
		fromId = Meteor.userId()
		# console.log '[methods] leaveRoom -> '.green, 'fromId:', fromId, 'roomId:', roomId

		unless Meteor.userId()?
			throw new Meteor.Error 300, 'Usuário não logado'

		room = ChatRoom.findOne roomId

		update =
			$pull:
				uids: Meteor.userId()

		ChatSubscription.update { rid: roomId },
			$set:
				rn: room.name
		,
			multi: true

		if room.t isnt 'c' and room.uids.indexOf(Meteor.userId()) isnt -1
			removedUser = Meteor.users.findOne Meteor.userId()

			ChatMessage.insert
				rid: roomId
				ts: (new Date)
				t: 'ul'
				msg: removedUser.name
				by: Meteor.userId()

		if room.uid is Meteor.userId()
			if not update.$set?
				update.$set = {}

			update.$set.uid = _.without(room.uids, Meteor.userId())[0]

		ChatSubscription.remove { rid: roomId, uid: Meteor.userId() }

		ChatRoom.update roomId, update
