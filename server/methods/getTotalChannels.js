Meteor.methods({
	getTotalChannels() {
		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'getTotalChannels'
			});
		}

		const query = {
			t: 'c'
		};
		return RocketChat.models.Rooms.find(query).count();
	}
});
