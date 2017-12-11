Meteor.methods({
	hideRoom(rid) {
		if (!Meteor.userId()) {
			return false;
		}

		ChatSubscription.update({
			rid,
			'u._id': Meteor.userId()
		}, {
			$set: {
				alert: false,
				open: false
			}
		});
	}
});
