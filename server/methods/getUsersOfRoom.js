Meteor.methods({
	getUsersOfRoom(roomId, showAll) {
		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'getUsersOfRoom' });
		}

		const room = Meteor.call('canAccessRoom', roomId, Meteor.userId());
		if (!room) {
			throw new Meteor.Error('error-invalid-room', 'Invalid room', { method: 'getUsersOfRoom' });
		}

		if (room.broadcast && !RocketChat.authz.hasPermission(Meteor.userId(), 'view-broadcast-member-list', roomId)) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', { method: 'getUsersOfRoom' });
		}

		const subscriptions = RocketChat.models.Subscriptions.findByRoomId(roomId, {fields: {u: 1}}).fetch().filter(s => s.u && s.u._id && s.u.username);
		const userIds = subscriptions.map(s => s.u._id);
		const options = {fields: {username: 1, name: 1}};

		const users = showAll === true
			? RocketChat.models.Users.findUsersWithUsernameByIds(userIds, options).fetch()
			: RocketChat.models.Users.findUsersWithUsernameByIdsNotOffline(userIds, options).fetch();

		return {
			total: userIds.length,
			records: users
		};
	}
});
