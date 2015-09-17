Meteor.methods
	saveRoomName: (rid, name) ->
		if not Meteor.userId()
			throw new Meteor.Error('invalid-user', "[methods] sendMessage -> Invalid user")

		room = RocketChat.models.Rooms.findOneById rid

		if room.t not in ['c', 'p']
			throw new Meteor.Error 403, 'Not allowed'

		unless RocketChat.authz.hasPermission(Meteor.userId(), 'edit-room', rid)
		#if room.u._id isnt Meteor.userId() and not hasPermission
			throw new Meteor.Error 403, 'Not allowed'

		if not /^[0-9a-z-_]+$/.test name
			throw new Meteor.Error 'name-invalid'

		name = _.slugify name

		if name is room.name
			return

		# avoid duplicate names
		if RocketChat.models.Rooms.findOneByName name
			throw new Meteor.Error 'duplicate-name'

		ChatRoom.update rid,
			$set:
				name: name

		RocketChat.models.Subscriptions.updateNameByRoomId rid, name

		ChatMessage.insert
			rid: rid
			ts: (new Date)
			t: 'r'
			msg: name
			u:
				_id: Meteor.userId()
				username: Meteor.user().username

		return name
