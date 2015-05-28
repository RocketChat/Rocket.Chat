Meteor.methods
	saveRoomName: (data) ->
		fromId = Meteor.userId()
		console.log '[methods] saveRoomName -> '.green, 'fromId:', fromId, 'data:', data

		room = ChatRoom.findOne data.rid

		if room.uid isnt Meteor.userId() and room.t is 'c'
			throw new Meteor.Error 403, 'Not allowed'

		if data.name is room.name
			return

		ChatRoom.update data.rid,
			$set:
				name: data.name
				nc: true

		ChatSubscription.update { rid: data.rid },
			$set:
				rn: data.name
		,
			multi: true

		ChatMessage.insert
			rid: data.rid
			ts: (new Date)
			t: 'r'
			msg: data.name
			by: Meteor.userId()

		return true
