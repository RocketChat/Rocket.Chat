Meteor.methods({
	leaveRoom(rid) {
		if (!Meteor.userId()) {
			return false;
		}

		ChatSubscription.remove({
			rid,
			'u._id': Meteor.userId()
		});
	}
});
