Meteor.methods
	saveRoomName: (data) ->
		fromId = Meteor.userId()
		# console.log '[methods] saveRoomName -> '.green, 'fromId:', fromId, 'data:', data

		room = ChatRoom.findOne data.rid

		if room.u._id isnt Meteor.userId() or room.t not in ['c', 'p']
			throw new Meteor.Error 403, 'Not allowed'

		newName = _.slugify data.name

		if newName is room.name
			return

		ChatRoom.update data.rid,
			$set:
				name: newName
				nc: true

		ChatSubscription.update { rid: data.rid },
			$set:
				rn: newName
		,
			multi: true

		ChatMessage.insert
			rid: data.rid
			ts: (new Date)
			t: 'r'
			msg: newName
			by: Meteor.user().username

		return true
