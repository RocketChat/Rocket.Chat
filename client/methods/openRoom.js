Meteor.methods({
	openRoom(rid) {
		if (!Meteor.userId()) {
			return false;
		}

		ChatSubscription.update({
			rid: rid,
			'u._id': Meteor.userId()
		}, {
			$set: {
				open: true
			}
		});
	}
});
