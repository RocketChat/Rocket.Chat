Meteor.methods({
	'livechat:getAgentData'(roomId) {
		check(roomId, String);

		const room = RocketChat.models.Rooms.findOneById(roomId);
		const user = Meteor.user();

		// allow to only user to send transcripts from their own chats
		if (!room || room.t !== 'l' || !room.v || !user.profile || room.v.token !== user.profile.token) {
			throw new Meteor.Error('error-invalid-room', 'Invalid room');
		}

		if (!room.servedBy) {
			return;
		}

		return RocketChat.models.Users.getAgentInfo(room.servedBy._id);
	}
});
