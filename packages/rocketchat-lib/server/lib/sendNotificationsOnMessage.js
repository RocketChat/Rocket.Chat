/* globals Push */
/*eslint complexity: ["error", 40]*/
import _ from 'underscore';
import s from 'underscore.string';
import moment from 'moment';

const CATEGORY_MESSAGE = 'MESSAGE';
const CATEGORY_MESSAGE_NOREPLY = 'MESSAGE_NOREPLY';

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

function canSendMessageToRoom(room, username) {
	return !((room.muted || []).includes(username));
}

/**
 * This function returns a string ready to be shown in the notification
 *
 * @param {object} message the message to be parsed
 */
function parseMessageText(message, userId) {
	const user = RocketChat.models.Users.findOneById(userId);
	const lng = user && user.language || RocketChat.settings.get('language') || 'en';

	if (!message.msg && message.attachments && message.attachments[0]) {
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
function notifyDesktopUser(userId, user, message, room, duration) {

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

function notifyAudioUser(userId, message, room) {
	RocketChat.Notifications.notifyUser(userId, 'audioNotification', {
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

const sendPushNotifications = (userIdsToPushNotify = [], message, room, push_room, push_username, push_message, pushUsernames) => {
	if (userIdsToPushNotify.length > 0 && Push.enabled === true) {
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
				},
				category: canSendMessageToRoom(room, pushUsernames[userIdToNotify]) ? CATEGORY_MESSAGE : CATEGORY_MESSAGE_NOREPLY
			});
		});
	}
};

const callJoin = (user, rid) => user.active && Meteor.runAsUser(user._id, () => Meteor.call('joinRoom', rid));
RocketChat.callbacks.add('afterSaveMessage', function(message, room, userId) {

	// skips this callback if the message was edited
	if (message.editedAt) {
		return message;
	}

	if (message.ts && Math.abs(moment(message.ts).diff()) > 60000) {
		return message;
	}

	const pushUsernames = {};

	const user = RocketChat.models.Users.findOneById(message.u._id);

	// might be a livechat visitor
	if (!user) {
		return message;
	}

	/*
	Increment unread couter if direct messages
	 */
	const settings = {
		alwaysNotifyDesktopUsers: [],
		dontNotifyDesktopUsers: [],
		alwaysNotifyMobileUsers: [],
		dontNotifyMobileUsers: [],
		desktopNotificationDurations: {},
		alwaysNotifyAudioUsers: [],
		dontNotifyAudioUsers: [],
		audioNotificationValues: {}
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
			desktop: [ 'dontNotifyDesktopUsers', 'alwaysNotifyDesktopUsers' ],
			mobile: [ 'dontNotifyMobileUsers', 'alwaysNotifyMobileUsers' ],
			audio: [ 'dontNotifyAudioUsers', 'alwaysNotifyAudioUsers' ]
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
	const users = {};
	RocketChat.models.Users.findUsersByIds(userIds, { fields: { 'settings.preferences': 1 } }).forEach((user) => {
		users[user._id] = user;
	});

	subscriptions.forEach(subscription => {
		if (subscription.disableNotifications) {
			settings.dontNotifyDesktopUsers.push(subscription.u._id);
			settings.dontNotifyMobileUsers.push(subscription.u._id);
			settings.dontNotifyAudioUsers.push(subscription.u._id);
			return;
		}

		const {
			audioNotifications = RocketChat.getUserPreference(users[subscription.u._id], 'audioNotifications'),
			desktopNotifications = RocketChat.getUserPreference(users[subscription.u._id], 'desktopNotifications'),
			mobilePushNotifications = RocketChat.getUserPreference(users[subscription.u._id], 'mobileNotifications')
		} = subscription;

		if (audioNotifications === 'all' && !disableAllMessageNotifications) {
			settings.alwaysNotifyAudioUsers.push(subscription.u._id);
		}
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

		settings.audioNotificationValues[subscription.u._id] = subscription.audioNotificationValue;
		settings.desktopNotificationDurations[subscription.u._id] = subscription.desktopNotificationDuration;
	});
	let userIdsForAudio = [];
	let userIdsToNotify = [];
	let userIdsToPushNotify = [];
	const mentions = [];
	const alwaysNotifyMobileBoolean = RocketChat.settings.get('Notifications_Always_Notify_Mobile');

	const usersWithHighlights = RocketChat.models.Users.findUsersByUsernamesWithHighlights(room.usernames, { fields: { '_id': 1, 'settings.preferences.highlights': 1 }}).fetch()
		.filter(user => messageContainsHighlight(message, user.settings.preferences.highlights));

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

			if (canBeNotified(userOfMentionId, 'desktop')) {
				const duration = settings.desktopNotificationDurations[userOfMention._id];
				notifyDesktopUser(userOfMention._id, user, message, room, duration);
			}

			if (canBeNotified(userOfMentionId, 'mobile')) {
				if (Push.enabled === true && (userOfMention.statusConnection !== 'online' || alwaysNotifyMobileBoolean === true)) {
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
						},
						category: canSendMessageToRoom(room, userOfMention.username) ? CATEGORY_MESSAGE : CATEGORY_MESSAGE_NOREPLY
					});
					return message;
				}
			}
		}

	} else {
		const mentionIds = (message.mentions || []).map(({_id}) => _id);
		const toAll = mentionIds.includes('all');
		const toHere = mentionIds.includes('here');

		if (mentionIds.length + settings.alwaysNotifyDesktopUsers.length > 0) {
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
			mentions.push(...usersOfDesktopMentions);
			if (room.t !== 'c') {
				usersOfDesktopMentions = _.reject(usersOfDesktopMentions, (usersOfMentionItem) => {
					return room.usernames.indexOf(usersOfMentionItem.username) === -1;
				});
			}

			userIdsToNotify = _.pluck(usersOfDesktopMentions, '_id');
		}

		if (mentionIds.length + settings.alwaysNotifyMobileUsers.length > 0) {
			let mobileMentionIds = _.union(mentionIds, settings.alwaysNotifyMobileUsers);
			mobileMentionIds = _.difference(mobileMentionIds, settings.dontNotifyMobileUsers);

			const usersOfMobileMentionsQuery = {
				_id: {
					$in: mobileMentionIds
				}
			};

			if (alwaysNotifyMobileBoolean !== true) {
				usersOfMobileMentionsQuery.statusConnection = { $ne: 'online' };
			}

			let usersOfMobileMentions = RocketChat.models.Users.find(usersOfMobileMentionsQuery, {
				fields: {
					_id: 1,
					username: 1,
					statusConnection: 1,
					active: 1
				}
			}).fetch();

			mentions.push(...usersOfMobileMentions);
			if (room.t !== 'c') {
				usersOfMobileMentions = _.reject(usersOfMobileMentions, usersOfMentionItem => !room.usernames.includes(usersOfMentionItem.username));
			}

			userIdsToPushNotify = usersOfMobileMentions.map(userMobile => {
				pushUsernames[userMobile._id] = userMobile.username;
				return userMobile._id;
			});
		}

		if (mentionIds.length + settings.alwaysNotifyAudioUsers.length > 0) {
			let audioMentionIds = _.union(mentionIds, settings.alwaysNotifyAudioUsers);
			audioMentionIds = _.difference(audioMentionIds, userIdsToNotify);

			let usersOfAudioMentions = RocketChat.models.Users.find({ _id: { $in: audioMentionIds }, statusConnection: {
				$ne:'offline'
			} }, {
				fields: {
					_id: 1,
					username: 1,
					active: 1
				}
			}).fetch();
			mentions.push(...usersOfAudioMentions);
			if (room.t !== 'c') {
				usersOfAudioMentions = _.reject(usersOfAudioMentions, (usersOfMentionItem) => {
					return room.usernames.indexOf(usersOfMentionItem.username) === -1;
				});
			}

			userIdsForAudio = _.pluck(usersOfAudioMentions, '_id');
		}

		if (room.t === 'c') {
			mentions.filter(user => !room.usernames.includes(user.username))
				.forEach(user =>callJoin(user, room._id));
		}

		if ([toAll, toHere].some(e => e) && room.usernames && room.usernames.length > 0) {
			RocketChat.models.Users.find({
				username: { $in: room.usernames },
				_id: { $ne: user._id }
			}, {
				fields: {
					_id: 1,
					username: 1,
					status: 1,
					statusConnection: 1
				}
			}).forEach(function(user) {
				if (['online', 'away', 'busy'].includes(user.status) && !(settings.dontNotifyDesktopUsers || []).includes(user._id)) {
					userIdsToNotify.push(user._id);
					userIdsForAudio.push(user._id);
				}
				if (toAll && user.statusConnection !== 'online' && !(settings.dontNotifyMobileUsers || []).includes(user._id)) {
					pushUsernames[user._id] = user.username;
					return userIdsToPushNotify.push(user._id);
				}
				if (toAll && user.statusConnection !== 'online') {
					userIdsForAudio.push(user._id);
				}
			});
		}

		if (usersWithHighlights.length > 0) {
			const highlightsIds = _.pluck(usersWithHighlights, '_id');
			userIdsForAudio = userIdsForAudio.concat(highlightsIds);
			userIdsToNotify = userIdsToNotify.concat(highlightsIds);
			userIdsToPushNotify = userIdsToPushNotify.concat(highlightsIds);
		}

		userIdsToNotify = _.without(_.compact(_.unique(userIdsToNotify)), message.u._id);
		userIdsToPushNotify = _.without(_.compact(_.unique(userIdsToPushNotify)), message.u._id);
		userIdsForAudio = _.without(_.compact(_.unique(userIdsForAudio)), message.u._id);

		for (const usersOfMentionId of userIdsToNotify) {
			const duration = settings.desktopNotificationDurations[usersOfMentionId];
			notifyDesktopUser(usersOfMentionId, user, message, room, duration);
		}
		for (const usersOfMentionId of userIdsForAudio) {
			notifyAudioUser(usersOfMentionId, message, room);
		}
		sendPushNotifications(userIdsToPushNotify, message, room, push_room, push_username, push_message, pushUsernames);

		const allUserIdsToNotify = _.unique(userIdsToNotify.concat(userIdsToPushNotify));
		RocketChat.Sandstorm.notify(message, allUserIdsToNotify,
			`@${ user.username }: ${ message.msg }`, room.t === 'p' ? 'privateMessage' : 'message');
	}

	return message;

}, RocketChat.callbacks.priority.LOW, 'sendNotificationOnMessage');
