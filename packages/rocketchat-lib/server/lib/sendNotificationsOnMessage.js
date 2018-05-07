import moment from 'moment';

import { callJoinRoom, messageContainsHighlight } from '../functions/notifications/';
import { sendEmail, shouldNotifyEmail } from '../functions/notifications/email';
import { sendSinglePush, shouldNotifyMobile } from '../functions/notifications/mobile';
import { notifyDesktopUser, shouldNotifyDesktop } from '../functions/notifications/desktop';
import { notifyAudioUser, shouldNotifyAudio } from '../functions/notifications/audio';

const sendNotification = ({
	subscription,
	sender,
	hasMentionToAll,
	hasMentionToHere,
	message,
	room,
	mentionIds,
	disableAllMessageNotifications
}) => {

	// don't notify the sender
	if (subscription.u._id === sender._id) {
		return;
	}

	// notifications disabled
	if (subscription.disableNotifications) {
		return;
	}

	// dont send notification to users who ignored the sender
	if (Array.isArray(subscription.ignored) && subscription.ignored.find(sender._id)) {
		return;
	}

	const hasMentionToUser = mentionIds.includes(subscription.u._id);

	// mute group notifications (@here and @all) if not directly mentioned as well
	if (!hasMentionToUser && subscription.muteGroupMentions && (hasMentionToAll || hasMentionToHere)) {
		return;
	}

	const receiver = RocketChat.models.Users.findOneById(subscription.u._id);

	if (!receiver || !receiver.active) {
		return;
	}

	const isHighlighted = messageContainsHighlight(message, receiver.settings && receiver.settings.preferences && receiver.settings.preferences.highlights);

	const {
		audioNotifications,
		desktopNotifications,
		mobilePushNotifications,
		emailNotifications
	} = subscription;

	let notificationSent = false;

	// busy users don't receive audio notification
	if (shouldNotifyAudio({
		disableAllMessageNotifications,
		status: receiver.status,
		audioNotifications,
		hasMentionToAll,
		hasMentionToHere,
		isHighlighted,
		hasMentionToUser
	})) {
		notifyAudioUser(subscription.u._id, message, room);
	}

	// busy users don't receive desktop notification
	if (shouldNotifyDesktop({
		disableAllMessageNotifications,
		status: receiver.status,
		desktopNotifications,
		hasMentionToAll,
		hasMentionToHere,
		isHighlighted,
		hasMentionToUser
	})) {
		notificationSent = true;
		notifyDesktopUser(subscription.u._id, sender, message, room, subscription.desktopNotificationDuration);
	}

	if (shouldNotifyMobile({
		disableAllMessageNotifications,
		mobilePushNotifications,
		hasMentionToAll,
		isHighlighted,
		hasMentionToUser,
		statusConnection: receiver.statusConnection
	})) {
		notificationSent = true;

		sendSinglePush({
			room,
			message,
			userId: subscription.u._id,
			senderUsername: sender.username,
			receiverUsername: receiver.username
		});
	}

	if (receiver.emails && shouldNotifyEmail({
		disableAllMessageNotifications,
		statusConnection: receiver.statusConnection,
		emailNotifications,
		isHighlighted,
		hasMentionToUser,
		hasMentionToAll
	})) {
		receiver.emails.some((email) => {
			if (email.verified) {
				sendEmail({ message, receiver, subscription, room, emailAddress: email.address });

				return true;
			}
		});
	}

	if (notificationSent) {
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

	// the find bellow is crucial. all subscription records returned will receive at least one kind of notification.
	// the query is defined by the server's default values and Notifications_Max_Room_Members setting.
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

	const mentionIds = (message.mentions || []).map(({_id}) => _id);
	const hasMentionToAll = mentionIds.includes('all');
	const hasMentionToHere = mentionIds.includes('here');

	subscriptions.forEach((subscription) => sendNotification({
		subscription,
		sender,
		hasMentionToAll,
		hasMentionToHere,
		message,
		room,
		mentionIds,
		disableAllMessageNotifications
	}));

	// on public channels, if a mentioned user is not member of the channel yet, he will first join the channel and then be notified based on his preferences.
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
					hasMentionToAll,
					hasMentionToHere,
					message,
					room,
					mentionIds
				});
			});
		});
	}

	return message;
}

RocketChat.callbacks.add('afterSaveMessage', sendAllNotifications, RocketChat.callbacks.priority.LOW, 'sendNotificationsOnMessage');

