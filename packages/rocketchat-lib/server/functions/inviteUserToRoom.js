RocketChat.inviteUserToRoom = function(rid, user, inviter) {
	const now = new Date();
	const room = RocketChat.models.Rooms.findOneById(rid);
	
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
