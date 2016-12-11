Meteor.methods({
	leaveRoom(rid) {
		if (!Meteor.userId()) {
			return false;
		}

		ChatSubscription.remove({
			rid: rid,
			'u._id': Meteor.userId()
		});

		ChatRoom.update(rid, {
			$pull: {
				usernames: Meteor.user().username
			}
		});
	}
});
