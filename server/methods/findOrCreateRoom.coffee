Meteor.methods
	findOrCreateClientRoomThenJoin: (clientId, usernames) ->
		m = clientId.match(/^(?:CLT){0,1}([0-9]+)/i);
		roomName = m[0];
		if not roomName?
			throw new Meteor.Error 403, '[methods] findOrCreateClientRoom -> Mal-format'
		
		room = RocketChat.models.Rooms.findOneByName(roomName);
		console.log '[methods] findOrCreateClientRoom -> '.green, 'userId:', Meteor.userId(), 'arguments:', arguments

		if not room?
			room = Meteor.call('createPrivateGroup', roomName, Meteor.userId(), usernames)
		Meteor.call 'joinRoom', room._id
