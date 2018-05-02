// import moment from 'moment';
// import s from 'underscore.string';

// RocketChat.callbacks.add('afterSaveMessage', function(message, room) {
// 	// skips this callback if the message was edited
// 	if (message.editedAt) {
// 		return message;
// 	}

// 	if (message.ts && Math.abs(moment(message.ts).diff()) > 60000) {
// 		return message;
// 	}

// 	const usersToSendEmail = {};
// 	if (room.t === 'd') {
// 		usersToSendEmail[message.rid.replace(message.u._id, '')] = 'direct';
// 	} else {
// 		let isMentionAll = message.mentions.find(mention => mention._id === 'all');

// 		if (isMentionAll) {
// 			const maxMembersForNotification = RocketChat.settings.get('Notifications_Max_Room_Members');
// 			if (maxMembersForNotification !== 0 && room.usernames.length > maxMembersForNotification) {
// 				isMentionAll = undefined;
// 			}
// 		}

// 		let query;
// 		if (isMentionAll) {
// 			// Query all users in room limited by the max room members setting
// 			query = RocketChat.models.Subscriptions.findByRoomId(room._id);
// 		} else {
// 			// Query only mentioned users, will be always a few users
// 			const userIds = message.mentions.map(mention => mention._id);
// 			query = RocketChat.models.Subscriptions.findByRoomIdAndUserIdsOrAllMessages(room._id, userIds);
// 		}

// 		query.forEach(sub => {
// 			if (sub.disableNotifications) {
// 				return delete usersToSendEmail[sub.u._id];
// 			}

// 			const { emailNotifications, muteGroupMentions } = sub;

// 			if (emailNotifications === 'nothing') {
// 				return delete usersToSendEmail[sub.u._id];
// 			}

// 			if (isMentionAll && muteGroupMentions) {
// 				return delete usersToSendEmail[sub.u._id];
// 			}

// 			const mentionedUser = isMentionAll || message.mentions.find(mention => mention._id === sub.u._id);

// 			if (emailNotifications === 'default' || emailNotifications == null) {
// 				if (mentionedUser) {
// 					return usersToSendEmail[sub.u._id] = 'default';
// 				}
// 				return delete usersToSendEmail[sub.u._id];
// 			}

// 			if (emailNotifications === 'mentions' && mentionedUser) {
// 				return usersToSendEmail[sub.u._id] = 'mention';
// 			}

// 			if (emailNotifications === 'all') {
// 				return usersToSendEmail[sub.u._id] = 'all';
// 			}
// 		});
// 	}
// 	const userIdsToSendEmail = Object.keys(usersToSendEmail);

// 	if (userIdsToSendEmail.length > 0) {
// 		const usersOfMention = RocketChat.models.Users.getUsersToSendOfflineEmail(userIdsToSendEmail).fetch();

// 		if (usersOfMention && usersOfMention.length > 0) {
// 			usersOfMention.forEach((user) => {
// 				const emailNotificationMode = RocketChat.getUserPreference(user, 'emailNotificationMode');
// 				if (usersToSendEmail[user._id] === 'default') {
// 					if (emailNotificationMode === 'all') { //Mention/DM
// 						usersToSendEmail[user._id] = 'mention';
// 					} else {
// 						return;
// 					}
// 				}

// 				if (usersToSendEmail[user._id] === 'direct') {
// 					const userEmailPreferenceIsDisabled = emailNotificationMode === 'disabled';
// 					const directMessageEmailPreference = RocketChat.models.Subscriptions.findOneByRoomIdAndUserId(message.rid, message.rid.replace(message.u._id, '')).emailNotifications;

// 					if (directMessageEmailPreference === 'nothing') {
// 						return;
// 					}

// 					if ((directMessageEmailPreference === 'default' || directMessageEmailPreference == null) && userEmailPreferenceIsDisabled) {
// 						return;
// 					}
// 				}

// 				// Checks if user is in the room he/she is mentioned (unless it's public channel)
// 				if (room.t !== 'c' && room.usernames.indexOf(user.username) === -1) {
// 					return;
// 				}


// 			});
// 		}
// 	}

// 	return message;

// }, RocketChat.callbacks.priority.LOW, 'sendEmailOnMessage');
