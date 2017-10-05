Meteor.methods({
	joinDefaultChannels(silenced) {
		check(silenced, Match.Optional(Boolean));

		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'joinDefaultChannels' });
		}

		this.unblock();
		return RocketChat.addUserToDefaultChannels(Meteor.user(), silenced);
	}
});
