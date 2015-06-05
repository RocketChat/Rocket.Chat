Meteor.methods
	leaveRoom: (roomId) ->
		fromId = Meteor.userId()
		# console.log '[methods] leaveRoom -> '.green, 'fromId:', fromId, 'roomId:', roomId

		unless Meteor.userId()?
			throw new Meteor.Error 300, 'Usuário não logado'

		room = ChatRoom.findOne roomId

		update =
			$pull:
				usernames: Meteor.user().username

		ChatSubscription.update { rid: roomId },
			$set:
				name: room.name
		,
			multi: true

		if room.t isnt 'c' and room.usernames.indexOf(Meteor.user().username) isnt -1
			removedUser = Meteor.user()

			ChatMessage.insert
				rid: roomId
				ts: (new Date)
				t: 'ul'
				msg: removedUser.name
				by: Meteor.userId()

		if room.u._id is Meteor.userId()
			newOwner = _.without(room.usernames, Meteor.user().username)[0]
			if newOwner?
				newOwner = Meteor.users.findOne username: newOwner

				if newOwner?
					if not update.$set?
						update.$set = {}

					update.$set['u._id'] = newOwner._id
					update.$set['u.username'] = newOwner.username

		ChatSubscription.remove { rid: roomId, 'u._id': Meteor.userId() }

		ChatRoom.update roomId, update
