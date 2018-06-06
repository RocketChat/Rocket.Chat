/**
 * Send notification after User have been mentioned and User is not in the room already
 *
 * @param {string} message
 * @param {object} room
 * @param {integer} userId
 *
 * @returns {string}
 */

function notifyOnUserMention(message, room, userId) {
	if (room != null && room.t === 'p') {
		const mentionedUsersThatAreNotInTheRoom = [];
		if (message.mentions != null) {
			message.mentions.forEach(function(mention) {
				if (mention._id !== message.u._id) {
					const userInTheRoom = RocketChat.models.Subscriptions.findByRoomAndUserId(room._id, mention._id).count();

					if (!userInTheRoom) {
						mentionedUsersThatAreNotInTheRoom.push(mention.username);
					}
				}
			});

			/* If user has permission to invite */
			const canAddUser = RocketChat.authz.hasAtLeastOnePermission(userId, ['add-user-to-any-p-room', 'add-user-to-joined-room'], room._id);

			if (canAddUser && mentionedUsersThatAreNotInTheRoom.length > 0) {
				const currentUser = RocketChat.models.Users.findOneById(userId);
				RocketChat.models.Messages.createMentionedUsersAreNotInTheRoom(room._id, {_id: 'rocket.cat', username: 'rocket.cat'}, {
					to: {
						_id: currentUser._id,
						username: currentUser.username
					},
					mentionedUsers: mentionedUsersThatAreNotInTheRoom,
					actionLinks: [
						{
							icon: 'icon-plus', i18nLabel: 'Invite', method_id: 'addUsersToRoom', params: {
								rid: room._id,
								users: mentionedUsersThatAreNotInTheRoom
							}
						}
					]
				});
			}
		}
	}

	return message;
}

RocketChat.callbacks.add('afterSaveMessage', notifyOnUserMention, RocketChat.callbacks.priority.LOW, 'notifyOnUserMention');
