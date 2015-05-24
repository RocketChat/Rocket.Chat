Meteor.methods
	removeUserFromRoom: (data) ->
		fromId = Meteor.userId()
		console.log '[methods] removeUserFromRoom -> '.green, 'fromId:', fromId, 'data:', data

		room = ChatRoom.findOne data.rid

		if room.uid isnt Meteor.userId() and room.t is 'g'
			throw new Meteor.Error 403, 'Not allowed'

		update =
			$pull:
				uids: data.uid

		removedUser = Meteor.users.findOne data.uid

		# if room name wasn't changed, update with new member
		unless room.nc
			users = _.without room.uids, data.uid

			usersName = []

			Meteor.users.find({ _id: { $in: users } }, { fields: { name: 1 }, sort: { name: 1 } }).forEach (user) ->
				usersName.push user.name

			room.name = usersName.join ', '

			update.$set =
				name: room.name

			ChatSubscription.update { rid: data.rid },
				$set:
					rn: room.name
			,
				multi: true

		ChatRoom.update data.rid, update

		ChatSubscription.remove { uid: data.uid, rid: data.rid }

		ChatMessage.insert
			rid: data.rid
			ts: (new Date)
			t: 'ru'
			msg: removedUser.name
			by: Meteor.userId()

		return true
