Meteor.methods
	toggleFavorite: (rid, f) ->
		if not Meteor.userId()
			throw new Meteor.Error('invalid-user', "[methods] toggleFavorite -> Invalid user")

		RocketChat.models.Subscriptions.setFavoriteByRoomIdAndUserId rid, Meteor.userId(), f
