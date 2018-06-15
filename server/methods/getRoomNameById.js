Meteor.methods({
	getRoomNameById(rid) {
		check(rid, String);

		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'getRoomNameById'
			});
		}

		const room = RocketChat.models.Rooms.findOneById(rid);

		if (room == null) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', {
				method: 'getRoomNameById'
			});
		}

		const user = Meteor.user();
		if (user && user.username && room.usernames.indexOf(user.username) !== -1) {
			return room.name;
		}

		if (room.t !== 'c' || RocketChat.authz.hasPermission(Meteor.userId(), 'view-c-room') !== true) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', {
				method: 'getRoomNameById'
			});
		}

		return room.name;
	}
});
