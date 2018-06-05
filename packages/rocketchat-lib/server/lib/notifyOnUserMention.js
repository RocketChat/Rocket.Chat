/**
 * Send notification after User mention and User is not in the room already
 *
 * @param {string} message
 * @param {object} room
 * @param {integer} userId
 *
 * @returns {string}
 */

function notifyOnUserMention(message, room, userId) {
	if (room != null) {
		const mentionIds = [];
		const mentionedUsersThatAreNotInTheRoom = [];
		if (message.mentions != null) {
			message.mentions.forEach(function(mention) {
				if (mention._id !== message.u._id) {
					mentionIds.push(mention._id);
					const userInTheRoom = RocketChat.models.Subscriptions.findByRoomAndUserId(room._id, mention._id).count();

					if (!userInTheRoom) {
						mentionedUsersThatAreNotInTheRoom.push(mention.username);
					}
				}
			});

			let canAddUser = false;
			if (RocketChat.authz.hasPermission(userId, 'add-user-to-joined-room', room._id)) {
				canAddUser = true;
			} else if (room.t === 'c' && RocketChat.authz.hasPermission(userId, 'add-user-to-any-c-room')) {
				canAddUser = true;
			} else if (room.t === 'p' && RocketChat.authz.hasPermission(userId, 'add-user-to-any-p-room')) {
				canAddUser = true;
			}

			if (canAddUser && mentionedUsersThatAreNotInTheRoom.length > 0) {
				const currentUser = RocketChat.models.Users.findOneById(userId);
				RocketChat.models.Messages.createMentionedUserIsNotInTheRoom(room._id, {_id: 'rocket.cat', username: 'rocket.cat'}, {
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

	// Update all the room activity tracker fields
	// This method take so long to execute on gient rooms cuz it will trugger the cache rebuild for the releations of that room
	RocketChat.models.Rooms.incMsgCountAndSetLastMessageById(message.rid, 1, message.ts, RocketChat.settings.get('Store_Last_Message') && message);
	// Update all other subscriptions to alert their owners but witout incrementing
	// the unread counter, as it is only for mentions and direct messages
	// We now set alert and open properties in two separate update commands. This proved to be more efficient on MongoDB - because it uses a more efficient index.
	RocketChat.models.Subscriptions.setAlertForRoomIdExcludingUserId(message.rid, message.u._id);
	RocketChat.models.Subscriptions.setOpenForRoomIdExcludingUserId(message.rid, message.u._id);

	return message;
}

RocketChat.callbacks.add('afterSaveMessage', notifyOnUserMention, RocketChat.callbacks.priority.LOW, 'notifyOnUserMention');
