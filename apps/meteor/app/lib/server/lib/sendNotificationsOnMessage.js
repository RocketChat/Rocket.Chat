import { Meteor } from 'meteor/meteor';
import moment from 'moment';

import { hasPermission } from '../../../authorization';
import { settings } from '../../../settings/server';
import { callbacks } from '../../../../lib/callbacks';
import { Subscriptions, Users } from '../../../models/server';
import {
	callJoinRoom,
	messageContainsHighlight,
	parseMessageTextPerUser,
	replaceMentionedUsernamesWithFullNames,
} from '../functions/notifications';
import { getEmailData, shouldNotifyEmail } from '../functions/notifications/email';
import { getPushData, shouldNotifyMobile } from '../functions/notifications/mobile';
import { notifyDesktopUser, shouldNotifyDesktop } from '../functions/notifications/desktop';
import { Notification } from '../../../notification-queue/server/NotificationQueue';
import { getMentions } from './notifyUsersOnMessage';
import { roomCoordinator } from '../../../../server/lib/rooms/roomCoordinator';

let TroubleshootDisableNotifications;

export const sendNotification = async ({
	subscription,
	sender,
	hasReplyToThread,
	hasMentionToAll,
	hasMentionToHere,
	message,
	notificationMessage,
	room,
	mentionIds,
	disableAllMessageNotifications,
}) => {
	if (TroubleshootDisableNotifications === true) {
		return;
	}

	// don't notify the sender
	if (subscription.u._id === sender._id) {
		return;
	}

	const hasMentionToUser = mentionIds.includes(subscription.u._id);

	// mute group notifications (@here and @all) if not directly mentioned as well
	if (!hasMentionToUser && !hasReplyToThread && subscription.muteGroupMentions && (hasMentionToAll || hasMentionToHere)) {
		return;
	}

	if (!subscription.receiver) {
		subscription.receiver = [
			Users.findOneById(subscription.u._id, {
				fields: {
					active: 1,
					emails: 1,
					language: 1,
					status: 1,
					statusConnection: 1,
					username: 1,
				},
			}),
		];
	}

	const [receiver] = subscription.receiver;

	const roomType = room.t;
	// If the user doesn't have permission to view direct messages, don't send notification of direct messages.
	if (roomType === 'd' && !hasPermission(subscription.u._id, 'view-d-room')) {
		return;
	}

	const isThread = !!message.tmid && !message.tshow;

	notificationMessage = parseMessageTextPerUser(notificationMessage, message, receiver);

	const isHighlighted = messageContainsHighlight(message, subscription.userHighlights);

	const { desktopNotifications, mobilePushNotifications, emailNotifications } = subscription;

	// busy users don't receive desktop notification
	if (
		shouldNotifyDesktop({
			disableAllMessageNotifications,
			status: receiver.status,
			statusConnection: receiver.statusConnection,
			desktopNotifications,
			hasMentionToAll,
			hasMentionToHere,
			isHighlighted,
			hasMentionToUser,
			hasReplyToThread,
			roomType,
			isThread,
		})
	) {
		notifyDesktopUser({
			notificationMessage,
			userId: subscription.u._id,
			user: sender,
			message,
			room,
		});
	}

	const queueItems = [];

	if (
		shouldNotifyMobile({
			disableAllMessageNotifications,
			mobilePushNotifications,
			hasMentionToAll,
			isHighlighted,
			hasMentionToUser,
			hasReplyToThread,
			roomType,
			isThread,
		})
	) {
		queueItems.push({
			type: 'push',
			data: await getPushData({
				notificationMessage,
				room,
				message,
				userId: subscription.u._id,
				senderUsername: sender.username,
				senderName: sender.name,
				receiver,
			}),
		});
	}

	if (
		receiver.emails &&
		shouldNotifyEmail({
			disableAllMessageNotifications,
			statusConnection: receiver.statusConnection,
			emailNotifications,
			isHighlighted,
			hasMentionToUser,
			hasMentionToAll,
			hasReplyToThread,
			roomType,
			isThread,
		})
	) {
		receiver.emails.some((email) => {
			if (email.verified) {
				queueItems.push({
					type: 'email',
					data: getEmailData({
						message,
						receiver,
						sender,
						subscription,
						room,
						emailAddress: email.address,
						hasMentionToUser,
					}),
				});

				return true;
			}
			return false;
		});
	}

	if (queueItems.length) {
		Notification.scheduleItem({
			user: receiver,
			uid: subscription.u._id,
			rid: room._id,
			mid: message._id,
			items: queueItems,
		});
	}
};

const project = {
	$project: {
		'desktopNotifications': 1,
		'emailNotifications': 1,
		'mobilePushNotifications': 1,
		'muteGroupMentions': 1,
		'name': 1,
		'rid': 1,
		'userHighlights': 1,
		'u._id': 1,
		'receiver.active': 1,
		'receiver.emails': 1,
		'receiver.language': 1,
		'receiver.status': 1,
		'receiver.statusConnection': 1,
		'receiver.username': 1,
	},
};

const filter = {
	$match: {
		'receiver.active': true,
	},
};

const lookup = {
	$lookup: {
		from: 'users',
		localField: 'u._id',
		foreignField: '_id',
		as: 'receiver',
	},
};

export async function sendMessageNotifications(message, room, usersInThread = []) {
	if (TroubleshootDisableNotifications === true) {
		return;
	}

	const sender = roomCoordinator.getRoomDirectives(room.t)?.getMsgSender(message.u._id);
	if (!sender) {
		return message;
	}

	const { toAll: hasMentionToAll, toHere: hasMentionToHere, mentionIds } = getMentions(message);

	const mentionIdsWithoutGroups = [...mentionIds];

	// getMentions removes `all` and `here` from mentionIds so we need to add them back for compatibility
	if (hasMentionToAll) {
		mentionIds.push('all');
	}
	if (hasMentionToHere) {
		mentionIds.push('here');
	}

	// add users in thread to mentions array because they follow the same rules
	mentionIds.push(...usersInThread);

	let notificationMessage = callbacks.run('beforeSendMessageNotifications', message.msg);
	if (mentionIds.length > 0 && settings.get('UI_Use_Real_Name')) {
		notificationMessage = replaceMentionedUsernamesWithFullNames(message.msg, message.mentions);
	}

	// Don't fetch all users if room exceeds max members
	const maxMembersForNotification = settings.get('Notifications_Max_Room_Members');
	const roomMembersCount = await Users.countRoomMembers(room._id);
	const disableAllMessageNotifications = roomMembersCount > maxMembersForNotification && maxMembersForNotification !== 0;

	const query = {
		rid: room._id,
		ignored: { $ne: sender._id },
		disableNotifications: { $ne: true },
		$or: [{ 'userHighlights.0': { $exists: 1 } }, ...(usersInThread.length > 0 ? [{ 'u._id': { $in: usersInThread } }] : [])],
	};

	['audio', 'desktop', 'mobile', 'email'].forEach((kind) => {
		const notificationField = `${kind === 'mobile' ? 'mobilePush' : kind}Notifications`;

		const filter = { [notificationField]: 'all' };

		if (disableAllMessageNotifications) {
			filter[`${kind}PrefOrigin`] = { $ne: 'user' };
		}

		query.$or.push(filter);

		if (mentionIdsWithoutGroups.length > 0) {
			query.$or.push({
				[notificationField]: 'mentions',
				'u._id': { $in: mentionIdsWithoutGroups },
			});
		} else if (!disableAllMessageNotifications && (hasMentionToAll || hasMentionToHere)) {
			query.$or.push({
				[notificationField]: 'mentions',
			});
		}

		const serverField = kind === 'email' ? 'emailNotificationMode' : `${kind}Notifications`;
		const serverPreference = settings.get(`Accounts_Default_User_Preferences_${serverField}`);
		if (
			(room.t === 'd' && serverPreference !== 'nothing') ||
			(!disableAllMessageNotifications && (serverPreference === 'all' || hasMentionToAll || hasMentionToHere))
		) {
			query.$or.push({
				[notificationField]: { $exists: false },
			});
		} else if (serverPreference === 'mentions' && mentionIdsWithoutGroups.length > 0) {
			query.$or.push({
				[notificationField]: { $exists: false },
				'u._id': { $in: mentionIdsWithoutGroups },
			});
		}
	});

	// the find below is crucial. All subscription records returned will receive at least one kind of notification.
	// the query is defined by the server's default values and Notifications_Max_Room_Members setting.

	const subscriptions = await Subscriptions.model
		.rawCollection()
		.aggregate([{ $match: query }, lookup, filter, project])
		.toArray();

	subscriptions.forEach((subscription) =>
		sendNotification({
			subscription,
			sender,
			hasMentionToAll,
			hasMentionToHere,
			message,
			notificationMessage,
			room,
			mentionIds,
			disableAllMessageNotifications,
			hasReplyToThread: usersInThread && usersInThread.includes(subscription.u._id),
		}),
	);

	return {
		sender,
		hasMentionToAll,
		hasMentionToHere,
		notificationMessage,
		mentionIds,
		mentionIdsWithoutGroups,
	};
}

export async function sendAllNotifications(message, room) {
	if (TroubleshootDisableNotifications === true) {
		return message;
	}

	// threads
	if (message.tmid) {
		return message;
	}
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

	const { sender, hasMentionToAll, hasMentionToHere, notificationMessage, mentionIds, mentionIdsWithoutGroups } =
		await sendMessageNotifications(message, room);

	// on public channels, if a mentioned user is not member of the channel yet, he will first join the channel and then be notified based on his preferences.
	if (room.t === 'c') {
		// get subscriptions from users already in room (to not send them a notification)
		const mentions = [...mentionIdsWithoutGroups];
		Subscriptions.findByRoomIdAndUserIds(room._id, mentionIdsWithoutGroups, {
			fields: { 'u._id': 1 },
		}).forEach((subscription) => {
			const index = mentions.indexOf(subscription.u._id);
			if (index !== -1) {
				mentions.splice(index, 1);
			}
		});

		Promise.all(
			mentions.map(async (userId) => {
				await callJoinRoom(userId, room._id);

				return userId;
			}),
		)
			.then((users) => {
				const subscriptions = Subscriptions.findByRoomIdAndUserIds(room._id, users).fetch();
				users.forEach((userId) => {
					const subscription = subscriptions.find((subscription) => subscription.u._id === userId);

					sendNotification({
						subscription,
						sender,
						hasMentionToAll,
						hasMentionToHere,
						message,
						notificationMessage,
						room,
						mentionIds,
					});
				});
			})
			.catch((error) => {
				throw new Meteor.Error(error);
			});
	}

	return message;
}

settings.watch('Troubleshoot_Disable_Notifications', (value) => {
	if (TroubleshootDisableNotifications === value) {
		return;
	}
	TroubleshootDisableNotifications = value;

	if (value) {
		return callbacks.remove('afterSaveMessage', 'sendNotificationsOnMessage');
	}

	callbacks.add(
		'afterSaveMessage',
		(message, room) => Promise.await(sendAllNotifications(message, room)),
		callbacks.priority.LOW,
		'sendNotificationsOnMessage',
	);
});
