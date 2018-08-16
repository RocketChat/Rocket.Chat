Meteor.methods({
	'livechat:closeRoom'(roomId, comment) {
		const userId = Meteor.userId();
		if (!userId || !RocketChat.authz.hasPermission(userId, 'close-livechat-room')) {
			throw new Meteor.Error('error-not-authorized', 'Not authorized', { method: 'livechat:closeRoom' });
		}

		const room = RocketChat.models.Rooms.findOneById(roomId);

		if (!room || room.t !== 'l') {
			throw new Meteor.Error('room-not-found', 'Room not found', { method: 'livechat:closeRoom' });
		}

		const user = Meteor.user();

		const subscription = RocketChat.models.Subscriptions.findOneByRoomIdAndUserId(roomId, user._id, { _id: 1 });
		if (!subscription && !RocketChat.authz.hasPermission(userId, 'close-others-livechat-room')) {
			throw new Meteor.Error('error-not-authorized', 'Not authorized', { method: 'livechat:closeRoom' });
		}

		return RocketChat.Livechat.closeRoom({
			user,
			room,
			comment,
		});
	},
});
