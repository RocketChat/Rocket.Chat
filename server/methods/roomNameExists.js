Meteor.methods({
	roomNameExists(rid) {
		check(rid, String);

		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'roomExists'
			});
		}
		const room = RocketChat.models.Rooms.findOneByName(rid);
		return !!room;
	}
});
