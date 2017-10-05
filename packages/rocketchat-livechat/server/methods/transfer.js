/* eslint new-cap: [2, {"capIsNewExceptions": ["Match.Optional"]}] */
Meteor.methods({
	'livechat:transfer'(transferData) {
		if (!Meteor.userId() || !RocketChat.authz.hasPermission(Meteor.userId(), 'view-l-room')) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', { method: 'livechat:transfer' });
		}

		check(transferData, {
			roomId: String,
			userId: Match.Optional(String),
			departmentId: Match.Optional(String)
		});

		const room = RocketChat.models.Rooms.findOneById(transferData.roomId);

		const guest = RocketChat.models.Users.findOneById(room.v._id);

		const user = Meteor.user();

		if (room.usernames.indexOf(user.username) === -1 && !RocketChat.authz.hasRole(Meteor.userId(), 'livechat-manager')) {
			throw new Meteor.Error('error-not-authorized', 'Not authorized', { method: 'livechat:transfer' });
		}

		return RocketChat.Livechat.transfer(room, guest, transferData);
	}
});
