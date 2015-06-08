Meteor.methods
	readMessages: (rid) ->
		if not Meteor.userId()
			throw new Meteor.Error 'invalid-user', '[methods] readMessages -> Invalid user'

		console.log '[methods] readMessages -> '.green, 'userId:', Meteor.userId(), 'arguments:', arguments

		ChatSubscription.update
			rid: rid
			'u._id': Meteor.userId()
		,
			$set:
				open: true
				alert: false
				unread: 0
				ls: (new Date())
