RocketChat.inviteUserToRoom = function(rid, user, inviter) {
	const now = new Date();
	const room = RocketChat.models.Rooms.findOneById(rid);

	// Check if user is already in room
	const subscription = RocketChat.models.Subscriptions.findOneByRoomIdAndUserId(rid, user._id);
	const inviterUsername = RocketChat.models.Users.findOneById(inviter).username;
	if (subscription) {
		return;
	}
	console.log('invite user')
	// TODO: send message to user
	RocketChat.models.Messages.createAcceptInvintationInTheRoom(rid, {_id: 'rocket.cat', username: 'rocket.cat'}, {
		to: {
			_id: user._id
		},
		inviter: inviterUsername,
		actionLinks: [
			{
				icon: 'icon-plus', i18nLabel: 'Accept', method_id: 'acceptInvintationToRoom', params: {
					rid
				}
			},
			{
				icon: 'icon-plus', i18nLabel: 'Decline', method_id: 'declineInvintationToRoom', params: {
					rid
				}
			}
		]
	});
	const muted = room.ro && !RocketChat.authz.hasPermission(user._id, 'post-readonly');

	RocketChat.models.Rooms.addUsernameById(rid, user.username, muted);
	RocketChat.models.Subscriptions.createWithRoomAndUser(room, user, {
		ts: now,
		open: true,
		alert: true,
		isActive: false,
		unread: 1,
		userMentions: 0,
		groupMentions: 0
	});
	// RocketChat.models.Messages.createMentionedUsersAreNotInTheRoom(room._id, {_id: 'rocket.cat', username: 'rocket.cat'}, {
	// 	to: {
	// 		_id: user._id,
	// 		username: user.username
	// 	},
	// 	actionLinks: [
	// 		{
	// 			icon: 'icon-plus', i18nLabel: 'Accept', method_id: 'acceptInvitation', params: {
	// 				rid: room._id
	// 			}
	// 		}
	// 	]
	// });

	// if (room.t === 'c' || room.t === 'p') {
	// 	RocketChat.callbacks.run('beforeJoinRoom', user, room);
	// }
	//
	// const muted = room.ro && !RocketChat.authz.hasPermission(user._id, 'post-readonly');
	// RocketChat.models.Rooms.addUsernameById(rid, user.username, muted);
	// RocketChat.models.Subscriptions.createWithRoomAndUser(room, user, {
	// 	ts: now,
	// 	open: true,
	// 	alert: true,
	// 	unread: 1,
	// 	userMentions: 1,
	// 	groupMentions: 0
	// });
	//
	// if (!silenced) {
	// 	if (inviter) {
	// 		RocketChat.models.Messages.createUserAddedWithRoomIdAndUser(rid, user, {
	// 			ts: now,
	// 			u: {
	// 				_id: inviter._id,
	// 				username: inviter.username
	// 			}
	// 		});
	// 	} else {
	// 		RocketChat.models.Messages.createUserJoinWithRoomIdAndUser(rid, user, { ts: now });
	// 	}
	// }
	//
	// if (room.t === 'c' || room.t === 'p') {
	// 	Meteor.defer(function() {
	// 		RocketChat.callbacks.run('afterJoinRoom', user, room);
	// 	});
	// }

	return true;
};
