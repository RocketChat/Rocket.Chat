Meteor.methods
	saveRoomName: (rid, name) ->
		if not Meteor.userId()
			throw new Meteor.Error('invalid-user', "[methods] sendMessage -> Invalid user")

		room = ChatRoom.findOne rid

		if room.u._id isnt Meteor.userId() or room.t not in ['c', 'p']
			throw new Meteor.Error 403, 'Not allowed'

		slugName = _.slugify name
		#if not /^[0-9a-z-_]+$/.test name
		#	throw new Meteor.Error 'name-invalid'

		#name = _.slugify name

		if slugName is room.name
			return

		if ChatRoom.findOne {name : slugName}
			throw new Meteor.Error 'duplicate-name'

		# avoid duplicate names
		#if ChatRoom.findOne({name:name})
		#	throw new Meteor.Error 'duplicate-name'

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
			slugName: slugName
			msg: name
			u:
				_id: Meteor.userId()
				username: Meteor.user().username

		return { slugName: slugName, name: name}
