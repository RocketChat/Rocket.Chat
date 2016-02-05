Meteor.methods
	toogleFavorite: (rid, f) ->
		if not Meteor.userId()
			throw new Meteor.Error('invalid-user', "[methods] toogleFavorite -> Invalid user")

		RocketChat.models.Subscriptions.setFavoriteByRoomIdAndUserId rid, Meteor.userId(), f
