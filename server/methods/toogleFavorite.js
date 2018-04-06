Meteor.methods({
	toggleFavorite(rid, f) {
		check(rid, String);

		check(f, Match.Optional(Boolean));
		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'toggleFavorite'
			});
		}

		const userSubscription = RocketChat.models.Subscriptions.findOneByRoomIdAndUserId(rid, Meteor.userId());
		if (!userSubscription) {
			throw new Meteor.Error('error-invalid-subscription',
				'Invalid subscription',
				{ method: 'toggleFavorite' }
			);
		}

		return RocketChat.models.Subscriptions.setFavoriteByRoomIdAndUserId(rid, Meteor.userId(), f);
	}
});
