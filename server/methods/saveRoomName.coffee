Meteor.methods
	saveRoomName: (rid, name) ->
		if not Meteor.userId()
			throw new Meteor.Error('invalid-user', "[methods] sendMessage -> Invalid user")

		room = ChatRoom.findOne rid

		if room.u._id isnt Meteor.userId() or room.t not in ['c', 'p']
			throw new Meteor.Error 403, 'Not allowed'

		slugName = _.slugify name

		if slugName is room.name
			return

		if ChatRoom.findOne {name : slugName}
			throw new Meteor.Error 'duplicate-name', 'There is an existing room with the same name'

		ChatRoom.update rid,
			$set:
				name: slugName
				displayName: name

		ChatSubscription.update
			rid: rid
		,
			$set:
				name: slugName
				displayName: name
				alert: true
		,
			multi: true

		ChatMessage.insert
			rid: rid
			ts: (new Date)
			t: 'r'
			msg: name
			u:
				_id: Meteor.userId()
				username: Meteor.user().username

		return true
