Meteor.methods({
	getUsersOfRoom(rid, showAll) {
		const userId = Meteor.userId();
		if (!userId) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'getUsersOfRoom' });
		}

		const room = Meteor.call('canAccessRoom', rid, userId);
		if (!room) {
			throw new Meteor.Error('error-invalid-room', 'Invalid room', { method: 'getUsersOfRoom' });
		}

		if (room.broadcast && !RocketChat.authz.hasPermission(userId, 'view-broadcast-member-list', rid)) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', { method: 'getUsersOfRoom' });
		}

		const subscriptions = RocketChat.models.Subscriptions.findByRoomIdWhenUsernameExists(rid, { fields: { 'u._id': 1 } }).fetch();
		const userIds = subscriptions.map((s) => s.u._id); // TODO: CACHE: expensive
		const options = { fields: { username: 1, name: 1 } };

		const users = showAll === true
			? RocketChat.models.Users.findUsersWithUsernameByIds(userIds, options).fetch()
			: RocketChat.models.Users.findUsersWithUsernameByIdsNotOffline(userIds, options).fetch();

		return {
			total: userIds.length,
			records: users,
		};
	},
});
