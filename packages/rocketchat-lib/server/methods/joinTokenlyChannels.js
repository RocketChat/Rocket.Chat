Meteor.methods({
	joinTokenlyChannels(silenced) {
		check(silenced, Match.Optional(Boolean));

		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'joinDefaultChannels' });
		}

		// TODO Tokenly
		// Get room's rid and then add user to room/channel

		// this.unblock();
		// return RocketChat.addUserToRoom(Meteor.user(), rid);
		return;
	}
});
