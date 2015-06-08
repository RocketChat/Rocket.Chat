Meteor.methods
	createDirectMessage: (username) ->
		if not Meteor.userId()
			throw new Meteor.Error 'invalid-user', "[methods] createDirectMessage -> Invalid user"

		console.log '[methods] createDirectMessage -> '.green, 'userId:', Meteor.userId(), 'arguments:', arguments

		me = Meteor.user()

		if me.username is username
			return

		to = Meteor.users.findOne
			username: username

		if not to
			throw new Meteor.Error('invalid-user', "[methods] createDirectMessage -> Invalid target user")

		rid = [me._id, to._id].sort().join('')

		now = new Date()

		# Make sure we have a room
		ChatRoom.upsert
			_id: rid
		,
			$set:
				usernames: [me.username, to.username]
			$setOnInsert:
				t: 'd'
				msgs: 0
				ts: now

		# Make user I have a subcription to this room
		ChatSubscription.upsert
			rid: rid
			$and: [{'u._id': me._id}]
		,
			$set:
				ts: now
				ls: now
			$setOnInsert:
				name: to.username
				t: 'd'
				open: true
				alert: false
				unread: 0
				u:
					_id: me._id
					username: me.username

		# Make user the target user has a subcription to this room
		ChatSubscription.upsert
			rid: rid
			$and: [{'u._id': to._id}]
		,
			$setOnInsert:
				name: me.username
				t: 'd'
				open: false
				alert: false
				unread: 0
				u:
					_id: to._id
					username: to.username

		return {
			rid: rid
		}
