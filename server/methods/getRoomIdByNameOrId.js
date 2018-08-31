// DEPRECATE
Meteor.methods({
	getRoomIdByNameOrId(rid) {
		check(rid, String);

		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'getRoomIdByNameOrId'
			});
		}

		const room = RocketChat.models.Rooms.findOneById(rid) || RocketChat.models.Rooms.findOneByName(rid);

		if (room == null) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', {
				method: 'getRoomIdByNameOrId'
			});
		}

		if (RocketChat.authz.hasPermission(Meteor.userId(), `view-${ room.t }-room`) !== true) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', {
				method: 'getRoomIdByNameOrId'
			});
		}

		return room._id;
	}
});
