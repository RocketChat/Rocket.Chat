Meteor.methods
	hideRoom: (rid) ->
		if not Meteor.userId()
			throw new Meteor.Error 'invalid-user', '[methods] hideRoom -> Invalid user'

		console.log '[methods] hideRoom -> '.green, 'userId:', Meteor.userId(), 'arguments:', arguments

		ChatSubscription.update
			rid: rid
			'u._id': Meteor.userId()
		,
			$set:
				alert: false
				open: false
