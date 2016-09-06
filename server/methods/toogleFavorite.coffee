Meteor.methods
	toggleFavorite: (rid, f) ->

		check rid, String
		check f, Match.Optional(Boolean)

		if not Meteor.userId()
			throw new Meteor.Error('error-invalid-user', "Invalid user", { method: 'toggleFavorite' })

		RocketChat.models.Subscriptions.setFavoriteByRoomIdAndUserId rid, Meteor.userId(), f
