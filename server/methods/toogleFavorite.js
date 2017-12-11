Meteor.methods({
	toggleFavorite(rid, f) {
		check(rid, String);

		check(f, Match.Optional(Boolean));
		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'toggleFavorite'
			});
		}

		return RocketChat.models.Subscriptions.setFavoriteByRoomIdAndUserId(rid, Meteor.userId(), f);
	}
});
