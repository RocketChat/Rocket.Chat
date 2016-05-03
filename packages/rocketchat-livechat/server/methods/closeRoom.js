Meteor.methods({
	'livechat:closeRoom'(roomId, comment) {
		const room = RocketChat.models.Rooms.findOneById(roomId);

		// @TODO add validations

		return RocketChat.Livechat.closeRoom({
			user: Meteor.user(),
			room: room,
			comment: comment
		});
	}
});
