Meteor.methods({
	unmuteUserInRoom(data) {
		const fromId = Meteor.userId();

		check(data, Match.ObjectIncluding({
			rid: String,
			username: String
		}));

		if (!RocketChat.authz.hasPermission(fromId, 'mute-user', data.rid)) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', {
				method: 'unmuteUserInRoom'
			});
		}

		const room = RocketChat.models.Rooms.findOneById(data.rid);

		if (!room) {
			throw new Meteor.Error('error-invalid-room', 'Invalid room', {
				method: 'unmuteUserInRoom'
			});
		}

		if (['c', 'p'].includes(room.t) === false) {
			throw new Meteor.Error('error-invalid-room-type', `${ room.t } is not a valid room type`, {
				method: 'unmuteUserInRoom',
				type: room.t
			});
		}

		if (Array.isArray(room.usernames) === false || room.usernames.includes(data.username) === false) {
			throw new Meteor.Error('error-user-not-in-room', 'User is not in this room', {
				method: 'unmuteUserInRoom'
			});
		}

		const unmutedUser = RocketChat.models.Users.findOneByUsername(data.username);

		RocketChat.models.Rooms.unmuteUsernameByRoomId(data.rid, unmutedUser.username);

		const fromUser = RocketChat.models.Users.findOneById(fromId);

		RocketChat.models.Messages.createUserUnmutedWithRoomIdAndUser(data.rid, unmutedUser, {
			u: {
				_id: fromUser._id,
				username: fromUser.username
			}
		});

		return true;
	}
});
