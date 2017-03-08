Meteor.methods({
	'assistify:closeRoom'(roomId, comment) {
		if (!Meteor.userId()) {
			throw new Meteor.Error('error-not-authorized', 'Not authorized', { method: 'assistify:closeRoom' });
		}

		const room = RocketChat.models.Rooms.findOneById(roomId);

		const user = Meteor.user();

		if (room.usernames.indexOf(user.username) === -1) {
			throw new Meteor.Error('error-not-authorized', 'Not authorized', { method: 'assistify:closeRoom' });
		}

		return RocketChat.Livechat.closeRoom({
			user: user,
			room: room,
			comment: comment
		});
	}
});
