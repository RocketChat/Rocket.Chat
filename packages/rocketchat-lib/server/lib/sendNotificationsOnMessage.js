/* globals Push */
import _ from 'underscore';
import moment from 'moment';

import { parseMessageText, callJoinRoom, messageContainsHighlight } from '../functions/notifications/';
import { sendEmail, shouldNotifyEmail } from '../functions/notifications/email';
import { sendSinglePush, shouldNotifyMobile } from '../functions/notifications/mobile';
import { notifyDesktopUser, shouldNotifyDesktop } from '../functions/notifications/desktop';
import { notifyAudioUser, shouldNotifyAudio } from '../functions/notifications/audio';

function sendNotificationOnMessage(message, room, userId) {

	// skips this callback if the message was edited
	if (message.editedAt) {
		return message;
	}

	if (message.ts && Math.abs(moment(message.ts).diff()) > 60000) {
		return message;
	}

	const pushUsernames = {};

	const user = (room.t !== 'l') ? RocketChat.models.Users.findOneById(message.u._id) : room.v;

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
		audioNotificationValues: {},
		dontNotifyUsersOnGroupMentions: []
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
	const subscriptions = RocketChat.models.Subscriptions.findNotificationPreferencesByRoom(room._id, disableAllMessageNotifications) || [];
	const userIds = [];
	subscriptions.forEach(s => userIds.push(s.u._id));
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

		if (Array.isArray(subscription.ignored) && subscription.ignored.find(message.u._id)) {
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

		if (subscription.muteGroupMentions) {
			settings.dontNotifyUsersOnGroupMentions.push(subscription.u._id);
		}
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
			}).forEach(function({ status, _id, username, statusConnection }) { // user
				if (Array.isArray(settings.dontNotifyUsersOnGroupMentions) && settings.dontNotifyUsersOnGroupMentions.includes(_id)) {
					return;
				}

				if (['online', 'away', 'busy'].includes(status) && !(settings.dontNotifyDesktopUsers || []).includes(_id)) {
					userIdsToNotify.push(_id);
					userIdsForAudio.push(_id);
				}
				if (toAll && statusConnection !== 'online' && !(settings.dontNotifyMobileUsers || []).includes(_id)) {
					pushUsernames[_id] = username;
					return userIdsToPushNotify.push(_id);
				}
				if (toAll && statusConnection !== 'online') {
					userIdsForAudio.push(_id);
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


		console.log('desktop ->',userIdsToNotify.length);
		console.log('audio ->',userIdsForAudio.length);
		console.log('push ->',userIdsToPushNotify.length);

		console.time('sending');
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
		console.timeEnd('sending');
	}

	return message;

}

let pushNumber = 0;
let desktopNumber = 0;
let audioNumber = 0;
let emailNumber = 0;
let totalSubs = 0;

const sendNotification = ({
	subscription,
	sender,
	toAll,
	toHere,
	message,
	room,
	mentionIds,
	alwaysNotifyMobileBoolean,
	push_room,
	push_username,
	push_message,
	disableAllMessageNotifications
}) => {
	totalSubs++;

	// don't notify the sender
	if (subscription.u._id === sender._id) {
		console.log('return; sender');
		return;
	}

	// notifications disabled
	if (subscription.disableNotifications) {
		// console.log('return; disableNotifications');
		return;
	}

	// dont send notification to users who ignored the sender
	if (Array.isArray(subscription.ignored) && subscription.ignored.find(sender._id)) {
		console.log('return; ignored');
		return;
	}

	// mute group notifications (@here and @all)
	if (subscription.muteGroupMentions && (toAll || toHere)) {
		console.log('return; muteGroupMentions');
		return;
	}

	const receiver = RocketChat.models.Users.findOneById(subscription.u._id);

	if (!receiver || !receiver.active) {
		console.log('no receiver ->', subscription.u._id);
		return;
	}

	const isHighlighted = messageContainsHighlight(message, receiver.settings && receiver.settings.preferences && receiver.settings.preferences.highlights);

	const isMentioned = mentionIds.includes(subscription.u._id);

	const {
		audioNotifications,
		desktopNotifications,
		mobilePushNotifications,
		emailNotifications
	} = subscription;

	let notificationSent = false;

	// busy users don't receive audio notification
	if (shouldNotifyAudio({ disableAllMessageNotifications, status: receiver.status, audioNotifications, toAll, toHere, isHighlighted, isMentioned})) {

		// settings.alwaysNotifyAudioUsers.push(subscription.u._id);
		// userIdsForAudio.push(subscription.u._id);
		notifyAudioUser(subscription.u._id, message, room);

		++audioNumber;
		// console.log('audio ->', ++audioNumber);
	}

	// busy users don't receive desktop notification
	if (shouldNotifyDesktop({ disableAllMessageNotifications, status: receiver.status, desktopNotifications, toAll, toHere, isHighlighted, isMentioned})) {
		// userIdsToNotify.push(subscription.u._id);

		notificationSent = true;

		++desktopNumber;
		notifyDesktopUser(subscription.u._id, sender, message, room, subscription.desktopNotificationDuration);
		// console.log('desktop ->', ++desktopNumber, toAll, toHere, isHighlighted, desktopNotifications === 'all', isMentioned);
	}

	if (shouldNotifyMobile({ disableAllMessageNotifications, mobilePushNotifications, toAll, isHighlighted, isMentioned, alwaysNotifyMobileBoolean, statusConnection: receiver.statusConnection })) {

		// only offline users will receive a push notification
		// userIdsToPushNotify.push(subscription.u._id);
		// pushUsernames[receiver._id] = receiver.username;

		notificationSent = true;

		sendSinglePush({
			room,
			roomId: message.rid,
			roomName: push_room,
			username: push_username,
			message: push_message,
			// badge: getBadgeCount(userIdToNotify),
			payload: {
				host: Meteor.absoluteUrl(),
				rid: message.rid,
				sender: message.u,
				type: room.t,
				name: room.name
			},
			userId: subscription.u._id,
			receiverUsername: receiver.username
		});
		pushNumber++;
		// console.log('push ->', ++pushNumber, toAll, isHighlighted, mobilePushNotifications === 'all', isMentioned);
	}

	if (shouldNotifyEmail({ disableAllMessageNotifications, statusConnection: receiver.statusConnection, emailNotifications, isHighlighted, isMentioned })) {

		// @TODO validate if user have verified emails: 'emails.verified' === true

		// @TODO send email
		receiver.emails.some((email) => {
			if (email.verified) {
				sendEmail({ message, receiver, subscription, room, emailAddress: email.address });

				return true;
			}
		});

		emailNumber++;
	}

	if (notificationSent) {
		// const allUserIdsToNotify = _.unique(userIdsToNotify.concat(userIdsToPushNotify));
		RocketChat.Sandstorm.notify(message, [subscription.u._id], `@${ sender.username }: ${ message.msg }`, room.t === 'p' ? 'privateMessage' : 'message');
	}

	// settings.audioNotificationValues[subscription.u._id] = subscription.audioNotificationValue;
	// settings.desktopNotificationDurations[subscription.u._id] = subscription.desktopNotificationDuration;
};

function notifyGroups(message, room, userId) {

	// skips this callback if the message was edited
	if (message.editedAt) {
		return message;
	}

	if (message.ts && Math.abs(moment(message.ts).diff()) > 60000) {
		return message;
	}

	if (!room || room.t == null) {
		return message;
	}

	// const pushUsernames = {};

	const sender = (room.t !== 'l') ? RocketChat.models.Users.findOneById(message.u._id) : room.v;
	if (!sender) {
		return message;
	}

	/*
	Increment unread couter if direct messages
	 */
	// const settings = {
	// 	alwaysNotifyDesktopUsers: [],
	// 	dontNotifyDesktopUsers: [],

	// 	alwaysNotifyMobileUsers: [],
	// 	dontNotifyMobileUsers: [],

	// 	alwaysNotifyAudioUsers: [],
	// 	dontNotifyAudioUsers: [],

	// 	desktopNotificationDurations: {},
	// 	audioNotificationValues: {},
	// 	dontNotifyUsersOnGroupMentions: []
	// };

	// Don't fetch all users if room exceeds max members
	const maxMembersForNotification = RocketChat.settings.get('Notifications_Max_Room_Members');
	const disableAllMessageNotifications = room.usernames.length > maxMembersForNotification && maxMembersForNotification !== 0;

	console.log('room.usernames.length ->', room.usernames.length);
	console.log('maxMembersForNotification ->', maxMembersForNotification);
	console.log('disableAllMessageNotifications ->', disableAllMessageNotifications);

	// console.time('findSubscriptions');

	// @TODO we should change the find based on default server preferences Mobile_Notifications_Default_Alert and Desktop_Notifications_Default_Alert
	// if default is 'all' -> exclude only 'nothing'
	// if default is 'mentions' -> exclude 'nothing'
	// if default is 'nothing' -> search only with 'all' or 'mentions'

	// @TODO maybe should also force find mentioned people
	let subscriptions = [];
	if (disableAllMessageNotifications) {
		// @TODO get only preferences set to all (because they have precedence over `max_room_members`)
		subscriptions = RocketChat.models.Subscriptions.findAllMessagesNotificationPreferencesByRoom(room._id) || [];
	} else {
		subscriptions = RocketChat.models.Subscriptions.findNotificationPreferencesByRoom(room._id) || [];
	}
	// console.timeEnd('findSubscriptions');

	// const userIdsForAudio = [];
	// const userIdsToNotify = [];
	// const userIdsToPushNotify = [];

	const alwaysNotifyMobileBoolean = RocketChat.settings.get('Notifications_Always_Notify_Mobile');

	const mentionIds = (message.mentions || []).map(({_id}) => _id);
	const toAll = mentionIds.includes('all');
	const toHere = mentionIds.includes('here');

	//Set variables depending on Push Notification settings
	let push_message = ' ';
	if (RocketChat.settings.get('Push_show_message')) {
		push_message = parseMessageText(message, userId);
	}

	let push_username = '';
	let push_room = '';
	if (RocketChat.settings.get('Push_show_username_room')) {
		push_username = sender.username;
		push_room = `#${ RocketChat.roomTypes.getRoomName(room.t, room) }`;
	}

	// @TODO mentions for a person that is not on the channel

	console.log('count ->', subscriptions.count());

	// console.time('eachSubscriptions');

	pushNumber = 0;
	desktopNumber = 0;
	audioNumber = 0;
	emailNumber = 0;
	totalSubs = 0;
	subscriptions.forEach((subscription) => sendNotification({
		subscription,
		sender,
		toAll,
		toHere,
		message,
		room,
		mentionIds,
		alwaysNotifyMobileBoolean,
		push_room,
		push_username,
		push_message,
		disableAllMessageNotifications
	}));
	// console.timeEnd('eachSubscriptions');

	if (room.t === 'c') {
		Promise.all(message.mentions
			.filter(({ _id, username }) => _id !== 'here' && _id !== 'all' && !room.usernames.includes(username))
			.map(async(user) => {
				await callJoinRoom(user, room._id);

				return user._id;
			})
		).then((users) => {
			users.forEach((userId) => {
				const subscription = RocketChat.models.Subscriptions.findOneByRoomIdAndUserId(room._id, userId);

				sendNotification({
					subscription,
					sender,
					toAll,
					toHere,
					message,
					room,
					mentionIds,
					alwaysNotifyMobileBoolean,
					push_room,
					push_username,
					push_message
				});
			});
		});
	}

	console.log('pushNumber ->',pushNumber);
	console.log('desktopNumber ->',desktopNumber);
	console.log('audioNumber ->',audioNumber);
	console.log('emailNumber ->',emailNumber);
	console.log('totalSubs ->',totalSubs);

	// console.time('sending');

	// console.time('sendDesktopNotifications');
	// for (const usersOfMentionId of userIdsToNotify) {
	// 	const duration = settings.desktopNotificationDurations[usersOfMentionId];
	// 	notifyDesktopUser(usersOfMentionId, sender, message, room, duration);
	// }
	// console.timeEnd('sendDesktopNotifications');

	// console.time('sendAudioNotifications');
	// for (const usersOfMentionId of userIdsForAudio) {
	// 	notifyAudioUser(usersOfMentionId, message, room);
	// }
	// console.timeEnd('sendAudioNotifications');

	// console.time('sendPushNotifications');
	// sendPushNotifications(userIdsToPushNotify, message, room, push_room, push_username, push_message, pushUsernames);
	// console.timeEnd('sendPushNotifications');

	// console.time('sendSandstormNotifications');
	// const allUserIdsToNotify = _.unique(userIdsToNotify.concat(userIdsToPushNotify));
	// RocketChat.Sandstorm.notify(message, allUserIdsToNotify, `@${ sender.username }: ${ message.msg }`, room.t === 'p' ? 'privateMessage' : 'message');
	// console.timeEnd('sendSandstormNotifications');

	// console.timeEnd('sending');

	// console.log('desktop ->', userIdsToNotify.length);
	// console.log('sound ->', userIdsForAudio.length);
	// console.log('push ->', userIdsToPushNotify.length);

	return message;
}


// RocketChat.callbacks.add('afterSaveMessage', sendNotificationOnMessage, RocketChat.callbacks.priority.LOW, 'sendNotificationOnMessage');

RocketChat.callbacks.add('afterSaveMessage', notifyGroups, RocketChat.callbacks.priority.LOW, 'sendNotificationGroupsOnMessage');

