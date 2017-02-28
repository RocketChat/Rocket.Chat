Meteor.methods({
	toggleFavorite(rid, f) {
		if (!Meteor.userId()) {
			return false;
		}

		ChatSubscription.update({
			rid: rid,
			'u._id': Meteor.userId()
		}, {
			$set: {
				f: f
			}
		});
	}
});
