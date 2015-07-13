Meteor.methods
	typingStatus: (rid, start) ->
		if not Meteor.userId()
			throw new Meteor.Error('invalid-user', "[methods] typingStatus -> Invalid user")

		console.log '[methods] typingStatus -> '.green, 'userId:', Meteor.userId(), 'arguments:', arguments

		filter =
			rid: rid
			$and: [{'u._id': Meteor.userId()}]

		if start
			msgData =
				'$set':
					expireAt: moment().add(30, 'seconds').toDate()
				'$setOnInsert':
					'u._id': Meteor.userId()
					'u.username': Meteor.user().username

			ChatTyping.upsert(filter, msgData)
		else

			ChatTyping.remove(filter)
