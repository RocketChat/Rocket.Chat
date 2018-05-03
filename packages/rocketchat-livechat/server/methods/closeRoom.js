Meteor.methods({
	'livechat:closeRoom'(roomId, comment) {
		if (!Meteor.userId() || !RocketChat.authz.hasPermission(Meteor.userId(), 'close-livechat-room')) {
			throw new Meteor.Error('error-not-authorized', 'Not authorized', { method: 'livechat:closeRoom' });
		}

		const room = RocketChat.models.Rooms.findOneById(roomId);

		if (!room || room.t !== 'l') {
			throw new Meteor.Error('room-not-found', 'Room not found', { method: 'livechat:closeRoom' });
		}

		const user = Meteor.user();

		if ((!room.usernames || room.usernames.indexOf(user.username) === -1) && !RocketChat.authz.hasPermission(Meteor.userId(), 'close-others-livechat-room')) {
			throw new Meteor.Error('error-not-authorized', 'Not authorized', { method: 'livechat:closeRoom' });
		}

		return RocketChat.Livechat.closeRoom({
			user,
			room,
			comment
		});
	}
});
