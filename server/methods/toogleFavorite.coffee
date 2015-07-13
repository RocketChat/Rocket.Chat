Meteor.methods
	toogleFavorite: (rid, f) ->
		if not Meteor.userId()
			throw new Meteor.Error('invalid-user', "[methods] toogleFavorite -> Invalid user")

		console.log '[methods] toogleFavorite -> '.green, 'userId:', Meteor.userId(), 'arguments:', arguments

		ChatSubscription.update
			rid: rid
			'u._id': Meteor.userId()
		,
			$set:
				f: f
