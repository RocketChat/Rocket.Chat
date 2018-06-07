Meteor.methods({
	muteUserInRoom(data) {
		check(data, Match.ObjectIncluding({
			rid: String,
			username: String
		}));

		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'muteUserInRoom'
			});
		}

		const fromId = Meteor.userId();

		if (!RocketChat.authz.hasPermission(fromId, 'mute-user', data.rid)) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', {
				method: 'muteUserInRoom'
			});
		}

		const room = RocketChat.models.Rooms.findOneById(data.rid);

		if (!room) {
			throw new Meteor.Error('error-invalid-room', 'Invalid room', {
				method: 'muteUserInRoom'
			});
		}

		if (['c', 'p'].includes(room.t) === false) {
			throw new Meteor.Error('error-invalid-room-type', `${ room.t } is not a valid room type`, {
				method: 'muteUserInRoom',
				type: room.t
			});
		}

		if (Array.isArray(room.usernames) === false || room.usernames.includes(data.username) === false) {
			throw new Meteor.Error('error-user-not-in-room', 'User is not in this room', {
				method: 'muteUserInRoom'
			});
		}

		const mutedUser = RocketChat.models.Users.findOneByUsername(data.username);

		RocketChat.models.Rooms.muteUsernameByRoomId(data.rid, mutedUser.username);

		const fromUser = RocketChat.models.Users.findOneById(fromId);

		RocketChat.models.Messages.createUserMutedWithRoomIdAndUser(data.rid, mutedUser, {
			u: {
				_id: fromUser._id,
				username: fromUser.username
			}
		});

		return true;
	}
});
