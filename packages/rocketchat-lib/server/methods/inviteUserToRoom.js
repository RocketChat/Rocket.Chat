Meteor.methods({
	inviteUserToRoom(data) {
		RocketChat.inviteUserToRoom(data.rid, data.user, data.inviter);
	}
});
