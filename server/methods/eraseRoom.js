/* globals RocketChat */

Meteor.methods({
	eraseRoom(rid) {
		check(rid, String);

		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'eraseRoom'
			});
		}

		const room = RocketChat.models.Rooms.findOneById(rid);

		if (!room) {
			throw new Meteor.Error('error-invalid-room', 'Invalid room', {
				method: 'eraseRoom'
			});
		}

		if (RocketChat.roomTypes.roomTypes[room.t].canBeDeleted(room)) {
			RocketChat.models.Messages.removeByRoomId(rid);
			RocketChat.models.Subscriptions.removeByRoomId(rid);
			return RocketChat.models.Rooms.removeById(rid);
		} else {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', {
				method: 'eraseRoom'
			});
		}
	}
});
