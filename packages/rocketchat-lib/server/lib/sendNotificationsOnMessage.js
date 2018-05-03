import moment from 'moment';

import { callJoinRoom, messageContainsHighlight } from '../functions/notifications/';
import { sendEmail, shouldNotifyEmail } from '../functions/notifications/email';
import { sendSinglePush, shouldNotifyMobile } from '../functions/notifications/mobile';
import { notifyDesktopUser, shouldNotifyDesktop } from '../functions/notifications/desktop';
import { notifyAudioUser, shouldNotifyAudio } from '../functions/notifications/audio';

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

	if (shouldNotifyMobile({ disableAllMessageNotifications, mobilePushNotifications, toAll, isHighlighted, isMentioned, statusConnection: receiver.statusConnection })) {

		// only offline users will receive a push notification
		// userIdsToPushNotify.push(subscription.u._id);
		// pushUsernames[receiver._id] = receiver.username;

		notificationSent = true;

		sendSinglePush({
			room,
			message,
			userId: subscription.u._id,
			senderUsername: sender.username,
			receiverUsername: receiver.username
		});
		pushNumber++;
		// console.log('push ->', ++pushNumber, toAll, isHighlighted, mobilePushNotifications === 'all', isMentioned);
	}

	if (receiver.emails && shouldNotifyEmail({ disableAllMessageNotifications, statusConnection: receiver.statusConnection, emailNotifications, isHighlighted, isMentioned })) {
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
};

function sendAllNotifications(message, room) {

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

	const sender = (room.t !== 'l') ? RocketChat.models.Users.findOneById(message.u._id) : room.v;
	if (!sender) {
		return message;
	}

	// Don't fetch all users if room exceeds max members
	const maxMembersForNotification = RocketChat.settings.get('Notifications_Max_Room_Members');
	const disableAllMessageNotifications = room.usernames.length > maxMembersForNotification && maxMembersForNotification !== 0;

	console.log('room.usernames.length ->', room.usernames.length);
	console.log('maxMembersForNotification ->', maxMembersForNotification);
	console.log('disableAllMessageNotifications ->', disableAllMessageNotifications);

	// console.time('findSubscriptions');

	// @TODO maybe should also force find mentioned people
	let subscriptions;
	if (disableAllMessageNotifications) {
		subscriptions = RocketChat.models.Subscriptions.findAllMessagesNotificationPreferencesByRoom(room._id);
	} else {
		const mentionsFilter = { $in: ['all', 'mentions'] };
		const excludesNothingFilter = { $ne: 'nothing' };

		subscriptions = RocketChat.models.Subscriptions.findNotificationPreferencesByRoom({
			roomId: room._id,
			desktopFilter: RocketChat.settings.get('Accounts_Default_User_Preferences_desktopNotifications') === 'nothing' ? mentionsFilter : excludesNothingFilter,
			emailFilter: RocketChat.settings.get('Accounts_Default_User_Preferences_emailNotificationMode') === 'disabled' ? mentionsFilter : excludesNothingFilter,
			mobileFilter: RocketChat.settings.get('Accounts_Default_User_Preferences_mobileNotifications') === 'nothing' ? mentionsFilter : excludesNothingFilter
		});
	}
	// console.timeEnd('findSubscriptions');

	// const userIdsToNotify = [];
	// const userIdsToPushNotify = [];

	const mentionIds = (message.mentions || []).map(({_id}) => _id);
	const toAll = mentionIds.includes('all');
	const toHere = mentionIds.includes('here');

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
					mentionIds
				});
			});
		});
	}

	console.log('pushNumber ->',pushNumber);
	console.log('desktopNumber ->',desktopNumber);
	console.log('audioNumber ->',audioNumber);
	console.log('emailNumber ->',emailNumber);
	console.log('totalSubs ->',totalSubs);

	return message;
}

RocketChat.callbacks.add('afterSaveMessage', sendAllNotifications, RocketChat.callbacks.priority.LOW, 'sendNotificationsOnMessage');

