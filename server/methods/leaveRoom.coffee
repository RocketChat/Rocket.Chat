Meteor.methods
	leaveRoom: (roomId) ->
		fromId = Meteor.userId()
		console.log '[methods] leaveRoom -> '.green, 'fromId:', fromId, 'roomId:', roomId

		unless Meteor.userId()?
			throw new Meteor.Error 300, 'Usuário não logado'

		room = ChatRoom.findOne roomId

		update =
			$pull:
				uids: Meteor.userId()

		# if room name wasn't changed, update with new member
		unless room.nc
			users = _.without room.uids, Meteor.userId()

			usersName = []

			Meteor.users.find({ _id: { $in: users } }, { fields: { name: 1 }, sort: { name: 1 } }).forEach (user) ->
				usersName.push user.name

			room.name = usersName.join ', '

			if not update.$set?
				update.$set = {}

			update.$set.name = room.name

		ChatSubscription.update { rid: roomId },
			$set:
				rn: room.name
		,
			multi: true

		if room.uids.indexOf(Meteor.userId()) isnt -1
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
