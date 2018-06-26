RocketChat.inviteUserToRoom = function(rid, user, inviter) {
// Get user and room details
	const room = RocketChat.models.Rooms.findOneById(rid);
	const userId = inviter;
	const inviterUser = RocketChat.models.Users.findOneById(inviter);
	const userInRoom = Array.isArray(room.usernames) && room.usernames.includes(inviterUser.username);

	// Can't invite to direct room ever
	if (room.t === 'd') {
		throw new Meteor.Error('error-cant-invite-for-direct-room', 'Can\'t invite user to direct rooms', {
			method: 'inviteUserToRoom'
		});
	}

	// Can add to any room you're in, with permission, otherwise need specific room type permission
	let canAddUser = false;
	if (userInRoom && RocketChat.authz.hasPermission(userId, 'add-user-to-joined-room', room._id)) {
		canAddUser = true;
	} else if (room.t === 'c' && RocketChat.authz.hasPermission(userId, 'add-user-to-any-c-room')) {
		canAddUser = true;
	} else if (room.t === 'p' && RocketChat.authz.hasPermission(userId, 'add-user-to-any-p-room')) {
		canAddUser = true;
	}
	// Inviting wasn't allowed
	if (!canAddUser) {
		throw new Meteor.Error('error-not-allowed', 'Not allowed', {
			method: 'inviteUserToRoom'
		});
	}

	if (!inviter) {
		throw new Error('The \'inviter\' parameter on \'inviteUserToRoom\' function is missing.');
	}
	const now = new Date();

	const subscription = RocketChat.models.Subscriptions.findOneByRoomIdAndUserId(rid, user._id);
	const inviterUsername = RocketChat.models.Users.findOneById(inviter).username;
	if (subscription) {
		return;
	}

	const invitationMessageExists = RocketChat.models.Messages.findByRoomIdAndTypeAndUserTo(rid, 'accept-invitation-in-the-room', user._id).fetch().length > 0;
	if (!invitationMessageExists) {
		RocketChat.models.Messages.createAcceptInvitationInTheRoom(rid, {_id: 'rocket.cat', username: 'rocket.cat'}, {
			to: {
				_id: user._id
			},
			inviter: inviterUsername,
			actionLinks: [
				{
					icon: 'icon-ok', i18nLabel: 'Accept', method_id: 'acceptInvitationToRoom', params: {
						rid,
						userId: user._id
					}
				},
				{
					icon: 'icon-cancel', i18nLabel: 'Decline', method_id: 'declineInvitationToRoom', params: {
						rid
					}
				}
			]
		});
	}

	const muted = room.ro && !RocketChat.authz.hasPermission(user._id, 'post-readonly');

	RocketChat.models.Rooms.addUsernameById(rid, user.username, muted);
	RocketChat.models.Subscriptions.createWithRoomAndUser(room, user, {
		ts: now,
		open: true,
		alert: true,
		active: false,
		unread: 1,
		userMentions: 0,
		groupMentions: 0
	});

	return true;
};
