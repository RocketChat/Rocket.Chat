RocketChat.addUserToRoom = function(rid, user, inviter, silenced) {
	const now = new Date();
	const room = RocketChat.models.Rooms.findOneById(rid);

	// Check if user is already in room
	const subscription = RocketChat.models.Subscriptions.findOneByRoomIdAndUserId(rid, user._id);
	if (subscription) {
		return;
	}

	// check group limit
	const groupLimitEnable = RocketChat.settings.get('Group_Limit_Enable');
	const groupLimit = RocketChat.settings.get('Group_Limit_Number');
	if (room.t === 'p' && groupLimitEnable && room.usernames.length >= groupLimit) {
		return;
	}

	if (room.t === 'c' || room.t === 'p') {
		RocketChat.callbacks.run('beforeJoinRoom', user, room);
	}

	var muted = room.ro && !RocketChat.authz.hasPermission(user._id, 'post-readonly');
	RocketChat.models.Rooms.addUsernameById(rid, user.username, muted);
	RocketChat.models.Subscriptions.createWithRoomAndUser(room, user, {
		ts: now,
		open: true,
		alert: true,
		unread: 1
	});

	if (!silenced) {
		if (inviter) {
			RocketChat.models.Messages.createUserAddedWithRoomIdAndUser(rid, user, {
				ts: now,
				u: {
					_id: inviter._id,
					username: inviter.username
				}
			});
		} else {
			RocketChat.models.Messages.createUserJoinWithRoomIdAndUser(rid, user, { ts: now });
		}
	}

	if (room.t === 'c' || room.t === 'p') {
		Meteor.defer(function() {
			RocketChat.callbacks.run('afterJoinRoom', user, room);
		});
	}

	return true;
};
