Meteor.methods
	saveRoomName: (rid, name) ->
		if not Meteor.userId()
			throw new Meteor.Error('invalid-user', "[methods] sendMessage -> Invalid user")

		room = ChatRoom.findOne rid

		if room.u._id isnt Meteor.userId() or room.t not in ['c', 'p']
			throw new Meteor.Error 403, 'Not allowed'

		if not /^[0-9a-z-_]+$/.test name
			throw new Meteor.Error 'name-invalid'

		name = _.slugify name

		if name is room.name
			return

		# avoid duplicate names
		if ChatRoom.findOne({name:name})
			throw new Meteor.Error 'duplicate-name'

		ChatRoom.update rid,
			$set:
				name: name

		ChatSubscription.update
			rid: rid
		,
			$set:
				name: name
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

		return name
