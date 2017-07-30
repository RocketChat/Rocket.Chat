/* globals Push */
import moment from 'moment';

/**
 * Replaces @username with full name
 *
 * @param {string} message The message to replace
 * @param {object[]} mentions Array of mentions used to make replacements
 *
 * @returns {string}
 */
function replaceMentionedUsernamesWithFullNames(message, mentions) {
	if (!mentions || !mentions.length) {
		return message;
	}
	mentions.forEach((mention) => {
		const user = RocketChat.models.Users.findOneById(mention._id);
		if (user && user.name) {
			message = message.replace(`@${ mention.username }`, user.name);
		}
	});
	return message;
}

/**
 * This function returns a string ready to be shown in the notification
 *
 * @param {object} message the message to be parsed
 */
function parseMessageText(message, userId) {
	const user = RocketChat.models.Users.findOneById(userId);
	const lng = user && user.language || RocketChat.settings.get('language') || 'en';

	if (!message.msg && message.attachments[0]) {
		message.msg = message.attachments[0].image_type ? TAPi18n.__('User_uploaded_image', {lng}) : TAPi18n.__('User_uploaded_file', {lng});
	}
	message.msg = RocketChat.callbacks.run('beforeNotifyUser', message.msg);

	return message.msg;
}
/**
 * Send notification to user
 *
 * @param {string} userId The user to notify
 * @param {object} user The sender
 * @param {object} room The room send from
 * @param {number} duration Duration of notification
 */
function notifyUser(userId, user, message, room, duration) {

	const UI_Use_Real_Name = RocketChat.settings.get('UI_Use_Real_Name') === true;
	message.msg = parseMessageText(message, userId);

	if (UI_Use_Real_Name) {
		message.msg = replaceMentionedUsernamesWithFullNames(message.msg, message.mentions);
	}
	let title = UI_Use_Real_Name ? user.name : `@${ user.username }`;
	if (room.t !== 'd' && room.name) {
		title += ` @ #${ room.name }`;
	}
	RocketChat.Notifications.notifyUser(userId, 'notification', {
		title,
		text: message.msg,
		duration,
		payload: {
			_id: message._id,
			rid: message.rid,
			sender: message.u,
			type: room.t,
			name: room.name
		}
	});
}

/**
 * Checks if a message contains a user highlight
 *
 * @param {string} message
 * @param {array|undefined} highlights
 *
 * @returns {boolean}
 */
function messageContainsHighlight(message, highlights) {
	if (! highlights || highlights.length === 0) { return false; }

	let has = false;
	highlights.some(function(highlight) {
		const regexp = new RegExp(s.escapeRegExp(highlight), 'i');
		if (regexp.test(message.msg)) {
			has = true;
			return true;
		}
	});

	return has;
}

function getBadgeCount(userId) {
	const subscriptions = RocketChat.models.Subscriptions.findUnreadByUserId(userId).fetch();

	return subscriptions.reduce((unread, sub) => {
		return sub.unread + unread;
	}, 0);
}

RocketChat.callbacks.add('afterSaveMessage', function(message, room, userId) {

	// skips this callback if the message was edited
	if (message.editedAt) {
		return message;
	}

	if (message.ts && Math.abs(moment(message.ts).diff()) > 60000) {
		return message;
	}

	const user = RocketChat.models.Users.findOneById(message.u._id);

	/*
	Increment unread couter if direct messages
	 */
	const settings = {
		alwaysNotifyDesktopUsers: [],
		dontNotifyDesktopUsers: [],
		alwaysNotifyMobileUsers: [],
		dontNotifyMobileUsers: [],
		desktopNotificationDurations: {}
	};

	/**
	 * Checks if a given user can be notified
	 *
	 * @param {string} id
	 * @param {string} type - mobile|desktop
	 *
	 * @returns {boolean}
     */
	function canBeNotified(id, type) {
		const types = {
			mobile: [ 'dontNotifyDesktopUsers', 'alwaysNotifyDesktopUsers' ],
			desktop: [ 'dontNotifyMobileUsers', 'alwaysNotifyMobileUsers' ]
		};

		return (settings[types[type][0]].indexOf(id) === -1 || settings[types[type][1]].indexOf(id) !== -1);
	}

	// Don't fetch all users if room exceeds max members
	const maxMembersForNotification = RocketChat.settings.get('Notifications_Max_Room_Members');
	const disableAllMessageNotifications = room.usernames.length > maxMembersForNotification && maxMembersForNotification !== 0;
	const subscriptions = RocketChat.models.Subscriptions.findNotificationPreferencesByRoom(room._id, disableAllMessageNotifications);
	const userIds = [];
	subscriptions.forEach((s) => {
		userIds.push(s.u._id);
	});
	const userSettings = {};
	RocketChat.models.Users.findUsersByIds(userIds, { fields: { 'settings.preferences.desktopNotifications': 1, 'settings.preferences.mobileNotifications': 1 } }).forEach((user) => {
		userSettings[user._id] = user.settings;
	});

	subscriptions.forEach((subscription) => {
		if (subscription.disableNotifications) {
			settings.dontNotifyDesktopUsers.push(subscription.u._id);
			settings.dontNotifyMobileUsers.push(subscription.u._id);
		} else {
			const preferences = userSettings[subscription.u._id] ? userSettings[subscription.u._id].preferences || {} : {};
			const userDesktopNotificationPreference = preferences.desktopNotifications !== 'default' ? preferences.desktopNotifications : undefined;
			const userMobileNotificationPreference = preferences.mobileNotifications !== 'default' ? preferences.mobileNotifications : undefined;
			// Set defaults if they don't exist
			const {
				desktopNotifications = userDesktopNotificationPreference || RocketChat.settings.get('Desktop_Notifications_Default_Alert'),
				mobilePushNotifications = userMobileNotificationPreference || RocketChat.settings.get('Mobile_Notifications_Default_Alert')
			} = subscription;

			if (desktopNotifications === 'all' && !disableAllMessageNotifications) {
				settings.alwaysNotifyDesktopUsers.push(subscription.u._id);
			} else if (desktopNotifications === 'nothing') {
				settings.dontNotifyDesktopUsers.push(subscription.u._id);
			}
			if (mobilePushNotifications === 'all' && !disableAllMessageNotifications) {
				settings.alwaysNotifyMobileUsers.push(subscription.u._id);
			} else if (mobilePushNotifications === 'nothing') {
				settings.dontNotifyMobileUsers.push(subscription.u._id);
			}
		}
		settings.desktopNotificationDurations[subscription.u._id] = subscription.desktopNotificationDuration;
	});

	let userIdsToNotify = [];
	let userIdsToPushNotify = [];
	const usersWithHighlights = [];

	const highlights = RocketChat.models.Users.findUsersByUsernamesWithHighlights(room.usernames, { fields: { '_id': 1, 'settings.preferences.highlights': 1 }}).fetch();

	highlights.forEach(function(user) {
		if (messageContainsHighlight(message, user.settings.preferences.highlights)) {
			usersWithHighlights.push(user);
		}
	});

	let push_message = ' ';
	//Set variables depending on Push Notification settings
	if (RocketChat.settings.get('Push_show_message')) {
		push_message = parseMessageText(message, userId);
	}

	let push_username = '';
	let push_room = '';
	if (RocketChat.settings.get('Push_show_username_room')) {
		push_username = user.username;
		push_room = `#${ room.name }`;
	}

	if (room.t == null || room.t === 'd') {
		const userOfMentionId = message.rid.replace(message.u._id, '');
		const userOfMention = RocketChat.models.Users.findOne({
			_id: userOfMentionId
		}, {
			fields: {
				username: 1,
				statusConnection: 1
			}
		});

		// Always notify Sandstorm
		if (userOfMention != null) {
			RocketChat.Sandstorm.notify(message, [userOfMention._id],
				`@${ user.username }: ${ message.msg }`, 'privateMessage');

		}
		if ((userOfMention != null) && canBeNotified(userOfMentionId, 'mobile')) {
			const duration = settings.desktopNotificationDurations[userOfMention._id];
			notifyUser(userOfMention._id, user, message, room, duration);
		}

		if ((userOfMention != null) && canBeNotified(userOfMentionId, 'desktop')) {
			if (Push.enabled === true && userOfMention.statusConnection !== 'online') {
				RocketChat.PushNotification.send({
					roomId: message.rid,
					username: push_username,
					message: push_message,
					badge: getBadgeCount(userOfMention._id),
					payload: {
						host: Meteor.absoluteUrl(),
						rid: message.rid,
						sender: message.u,
						type: room.t,
						name: room.name
					},
					usersTo: {
						userId: userOfMention._id
					}
				});
				return message;
			}
		}

	} else {
		const mentionIds = [];
		if (message.mentions != null) {
			message.mentions.forEach(function(mention) {
				return mentionIds.push(mention._id);
			});
		}
		const toAll = mentionIds.indexOf('all') > -1;
		const toHere = mentionIds.indexOf('here') > -1;
		if (mentionIds.length > 0 || settings.alwaysNotifyDesktopUsers.length > 0) {
			let desktopMentionIds = _.union(mentionIds, settings.alwaysNotifyDesktopUsers);
			desktopMentionIds = _.difference(desktopMentionIds, settings.dontNotifyDesktopUsers);

			let usersOfDesktopMentions = RocketChat.models.Users.find({
				_id: {
					$in: desktopMentionIds
				}
			}, {
				fields: {
					_id: 1,
					username: 1,
					active: 1
				}
			}).fetch();
			if (room.t === 'c' && !toAll) {
				const callJoin = function(usersOfMentionItem) {
					if (usersOfMentionItem.active) {
						Meteor.runAsUser(usersOfMentionItem._id, function() {
							return Meteor.call('joinRoom', room._id);
						});
					}
				};
				for (const usersOfMentionItem of usersOfDesktopMentions) {
					if (room.usernames.indexOf(usersOfMentionItem.username) === -1) {
						callJoin(usersOfMentionItem);
					}
				}
			}

			if (room.t !== 'c') {
				usersOfDesktopMentions = _.reject(usersOfDesktopMentions, (usersOfMentionItem) => {
					return room.usernames.indexOf(usersOfMentionItem.username) === -1;
				});
			}

			userIdsToNotify = _.pluck(usersOfDesktopMentions, '_id');
		}

		if (mentionIds.length > 0 || settings.alwaysNotifyMobileUsers.length > 0) {
			let mobileMentionIds = _.union(mentionIds, settings.alwaysNotifyMobileUsers);
			mobileMentionIds = _.difference(mobileMentionIds, settings.dontNotifyMobileUsers);

			let usersOfMobileMentions = RocketChat.models.Users.find({
				_id: {
					$in: mobileMentionIds
				}
			}, {
				fields: {
					_id: 1,
					username: 1,
					statusConnection: 1
				}
			}).fetch();

			if (room.t !== 'c') {
				usersOfMobileMentions = _.reject(usersOfMobileMentions, (usersOfMentionItem) => {
					return room.usernames.indexOf(usersOfMentionItem.username) === -1;
				});
			}

			userIdsToPushNotify = _.pluck(_.filter(usersOfMobileMentions, function(user) {
				return user.statusConnection !== 'online';
			}), '_id');
		}

		if ((toAll || toHere) && room.usernames && room.usernames.length > 0) {
			RocketChat.models.Users.find({
				username: {
					$in: room.usernames
				},
				_id: {
					$ne: user._id
				}
			}, {
				fields: {
					_id: 1,
					username: 1,
					status: 1,
					statusConnection: 1
				}
			}).forEach(function(user) {
				if (['online', 'away', 'busy'].includes(user.status) && (settings.dontNotifyDesktopUsers || []).includes(user._id) === false) {
					userIdsToNotify.push(user._id);
				}
				if (toAll && user.statusConnection !== 'online' && (settings.dontNotifyMobileUsers || []).includes(user._id) === false) {
					return userIdsToPushNotify.push(user._id);
				}
			});
		}

		if (usersWithHighlights.length > 0) {
			const highlightsIds = _.pluck(usersWithHighlights, '_id');
			userIdsToNotify = userIdsToNotify.concat(highlightsIds);
			userIdsToPushNotify = userIdsToPushNotify.concat(highlightsIds);
		}

		userIdsToNotify = _.without(_.compact(_.unique(userIdsToNotify)), message.u._id);
		userIdsToPushNotify = _.without(_.compact(_.unique(userIdsToPushNotify)), message.u._id);

		if (userIdsToNotify.length > 0) {
			for (const usersOfMentionId of userIdsToNotify) {
				const duration = settings.desktopNotificationDurations[usersOfMentionId];
				notifyUser(usersOfMentionId, user, message, room, duration);
			}
		}

		if (userIdsToPushNotify.length > 0) {
			if (Push.enabled === true) {
				// send a push notification for each user individually (to get his/her badge count)
				userIdsToPushNotify.forEach((userIdToNotify) => {
					RocketChat.PushNotification.send({
						roomId: message.rid,
						roomName: push_room,
						username: push_username,
						message: push_message,
						badge: getBadgeCount(userIdToNotify),
						payload: {
							host: Meteor.absoluteUrl(),
							rid: message.rid,
							sender: message.u,
							type: room.t,
							name: room.name
						},
						usersTo: {
							userId: userIdToNotify
						}
					});
				});
			}
		}

		const allUserIdsToNotify = _.unique(userIdsToNotify.concat(userIdsToPushNotify));
		if (room.t === 'p') {
			RocketChat.Sandstorm.notify(message, allUserIdsToNotify,
				`@${ user.username }: ${ message.msg }`, 'privateMessage');
		} else {
			RocketChat.Sandstorm.notify(message, allUserIdsToNotify,
				`@${ user.username }: ${ message.msg }`, 'message');
		}
	}

	return message;

}, RocketChat.callbacks.priority.LOW, 'sendNotificationOnMessage');
