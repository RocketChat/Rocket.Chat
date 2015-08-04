Meteor.methods
	createDirectMessage: (username, accessPermissions) ->
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

		if not accessPermissions
			throw new Meteor.Error('invalid-argument', "Missing security label")

		if not Jedis.securityLabelIsValid(accessPermissions)
			throw new Meteor.Error('invalid-access-permissions', "Missing required access permissions")

		result = Meteor.call 'canAccessResource', [me._id,to._id], accessPermissions
		if not result.canAccess
			throw new Meteor.Error('invalid-access-permissions', result.deniedUsers.join(', ') + " cannot participate in a direct message with the specified access permissions")

		rid = [me._id, to._id].sort().join('')

		now = new Date()

		# Make sure we have a room
		ChatRoom.upsert
			_id: rid
		,
			$set:
				usernames: [me.username, to.username]
				accessPermissions: accessPermissions
				securityLabels: Jedis.legacyLabel(accessPermissions)
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
