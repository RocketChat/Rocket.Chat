Meteor.methods
	toogleFavorite: (rid, f) ->
		if not Meteor.userId()
			throw new Meteor.Error('invalid-user', "[methods] toogleFavorite -> Invalid user")

		console.log '[methods] toogleFavorite -> '.green, 'userId:', Meteor.userId(), 'arguments:', arguments

		RocketChat.models.Subscriptions.setFavoriteByRoomIdAndUserId rid, Meteor.userId(), f
