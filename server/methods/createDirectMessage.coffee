Meteor.methods
	createDirectMessage: (username) ->
		if not Meteor.userId()
			throw new Meteor.Error 'error-invalid-user', "Invalid user", { method: 'createDirectMessage' }

		me = Meteor.user()

		unless me.username
			throw new Meteor.Error 'error-invalid-user', "Invalid user", { method: 'createDirectMessage' }

		if me.username is username
			throw new Meteor.Error 'error-invalid-user', "Invalid user", { method: 'createDirectMessage' }

		to = RocketChat.models.Users.findOneByUsername username

		if not to
			throw new Meteor.Error 'error-invalid-user', "Invalid user", { method: 'createDirectMessage' }

		rid = [me._id, to._id].sort().join('')

		now = new Date()

		# Make sure we have a room
		RocketChat.models.Rooms.upsert
			_id: rid
		,
			$set:
				usernames: [me.username, to.username]
			$setOnInsert:
				t: 'd'
				msgs: 0
				ts: now

		# Make user I have a subcription to this room
		RocketChat.models.Subscriptions.upsert
			rid: rid
			$and: [{'u._id': me._id}] # work around to solve problems with upsert and dot
		,
			$set:
				ts: now
				ls: now
				open: true
			$setOnInsert:
				name: to.username
				t: 'd'
				alert: false
				unread: 0
				u:
					_id: me._id
					username: me.username

		# Make user the target user has a subcription to this room
		RocketChat.models.Subscriptions.upsert
			rid: rid
			$and: [{'u._id': to._id}] # work around to solve problems with upsert and dot
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
