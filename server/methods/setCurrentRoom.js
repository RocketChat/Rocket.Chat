Meteor.methods({
	setCurrentRoom(roomId) {
		check(roomId, Match.OneOf(String, null));

		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'setCurrentRoom'
			});
		}

		const user = Meteor.user();

		if (user) {
			RocketChat.models.Users.setCurrentRoom(Meteor.userId(), roomId);
			return true;
		}

		return false;
	}
});
