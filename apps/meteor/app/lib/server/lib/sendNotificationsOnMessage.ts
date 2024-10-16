import {
	type IMessage,
	type ISubscription,
	type IUser,
	type IRoom,
	type NotificationItem,
	isEditedMessage,
	type AtLeast,
} from '@rocket.chat/core-typings';
import { Subscriptions, Users } from '@rocket.chat/models';
import emojione from 'emojione';
import moment from 'moment';
import type { RootFilterOperators } from 'mongodb';

import { callbacks } from '../../../../lib/callbacks';
import { roomCoordinator } from '../../../../server/lib/rooms/roomCoordinator';
import { hasPermissionAsync } from '../../../authorization/server/functions/hasPermission';
import { Notification } from '../../../notification-queue/server/NotificationQueue';
import { settings } from '../../../settings/server';
import { messageContainsHighlight, parseMessageTextPerUser, replaceMentionedUsernamesWithFullNames } from '../functions/notifications';
import { notifyDesktopUser, shouldNotifyDesktop } from '../functions/notifications/desktop';
import { getEmailData, shouldNotifyEmail } from '../functions/notifications/email';
import { getPushData, shouldNotifyMobile } from '../functions/notifications/mobile';
import { getMentions } from './notifyUsersOnMessage';

type SubscriptionAggregation = {
	receiver: [Pick<IUser, 'active' | 'emails' | 'language' | 'status' | 'statusConnection' | 'username' | 'settings'> | null];
} & Pick<
	ISubscription,
	'desktopNotifications' | 'emailNotifications' | 'mobilePushNotifications' | 'muteGroupMentions' | 'name' | 'rid' | 'userHighlights' | 'u'
>;

type WithRequiredProperty<Type, Key extends keyof Type> = Type & {
	[Property in Key]-?: Type[Property];
};

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
}: {
	subscription: SubscriptionAggregation;
	sender: Pick<IUser, '_id' | 'name' | 'username'>;

	hasReplyToThread: boolean;
	hasMentionToAll: boolean;
	hasMentionToHere: boolean;
	message: AtLeast<IMessage, '_id' | 'u' | 'msg' | 't' | 'attachments'>;
	notificationMessage: string;
	room: IRoom;
	mentionIds: string[];
	disableAllMessageNotifications: boolean;
}) => {
	if (settings.get<boolean>('Troubleshoot_Disable_Notifications') === true) {
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
			await Users.findOneById(subscription.u._id, {
				projection: {
					'active': 1,
					'emails': 1,
					'language': 1,
					'status': 1,
					'statusConnection': 1,
					'username': 1,
					'settings.preferences.enableMobileRinging': 1,
				},
			}),
		];
	}

	const [receiver] = subscription.receiver;

	if (!receiver) {
		throw new Error('receiver not found');
	}

	const roomType = room.t;
	// If the user doesn't have permission to view direct messages, don't send notification of direct messages.
	if (roomType === 'd' && !(await hasPermissionAsync(subscription.u._id, 'view-d-room'))) {
		return;
	}

	const isThread = !!message.tmid && !message.tshow;
	const isVideoConf = message.t === 'videoconf';

	notificationMessage = await parseMessageTextPerUser(notificationMessage, message, receiver);

	const isHighlighted = messageContainsHighlight(message, subscription.userHighlights);

	const { desktopNotifications, mobilePushNotifications, emailNotifications } = subscription;

	// busy users don't receive desktop notification
	if (
		shouldNotifyDesktop({
			disableAllMessageNotifications,
			status: receiver.status ?? 'offline',
			statusConnection: receiver.statusConnection ?? 'offline',
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
		await notifyDesktopUser({
			notificationMessage,
			userId: subscription.u._id,
			user: sender,
			message,
			room,
		});
	}

	const queueItems: NotificationItem[] = [];

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
			isVideoConf,
			userPreferences: receiver.settings?.preferences,
			roomUids: room.uids,
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
		const messageWithUnicode = message.msg ? emojione.shortnameToUnicode(message.msg) : message.msg;
		const firstAttachment = message.attachments?.length && message.attachments.shift();

		if (firstAttachment) {
			firstAttachment.description =
				typeof firstAttachment.description === 'string' ? emojione.shortnameToUnicode(firstAttachment.description) : undefined;
			firstAttachment.text = typeof firstAttachment.text === 'string' ? emojione.shortnameToUnicode(firstAttachment.text) : undefined;
		}

		const attachments = firstAttachment ? [firstAttachment, ...(message.attachments ?? [])].filter(Boolean) : [];
		for await (const email of receiver.emails) {
			if (email.verified) {
				queueItems.push({
					type: 'email',
					data: await getEmailData({
						message: {
							...message,
							msg: messageWithUnicode,
							...(attachments.length > 0 ? { attachments } : {}),
						},
						receiver,
						sender,
						subscription,
						room,
						emailAddress: email.address,
						hasMentionToUser,
					}),
				});

				break;
			}
		}
	}

	if (queueItems.length) {
		void Notification.scheduleItem({
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
		'receiver.settings.preferences.enableMobileRinging': 1,
	},
} as const;

const filter = {
	$match: {
		'receiver.active': true,
	},
} as const;

const lookup = {
	$lookup: {
		from: 'users',
		localField: 'u._id',
		foreignField: '_id',
		as: 'receiver',
	},
} as const;

export async function sendMessageNotifications(message: IMessage, room: IRoom, usersInThread: string[] = []) {
	if (settings.get<boolean>('Troubleshoot_Disable_Notifications') === true) {
		return;
	}

	const sender = await roomCoordinator.getRoomDirectives(room.t).getMsgSender(message);
	if (!sender) {
		return message;
	}

	const { toAll: hasMentionToAll, toHere: hasMentionToHere, mentionIds } = await getMentions(message);

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

	let notificationMessage = await callbacks.run('beforeSendMessageNotifications', message.msg);
	if (mentionIds.length > 0 && settings.get('UI_Use_Real_Name')) {
		notificationMessage = replaceMentionedUsernamesWithFullNames(message.msg, message.mentions ?? []);
	}

	// Don't fetch all users if room exceeds max members
	const maxMembersForNotification = settings.get<number>('Notifications_Max_Room_Members');
	const roomMembersCount = await Users.countRoomMembers(room._id);
	const disableAllMessageNotifications = roomMembersCount > maxMembersForNotification && maxMembersForNotification !== 0;

	const query: WithRequiredProperty<RootFilterOperators<ISubscription>, '$or'> = {
		rid: room._id,
		ignored: { $ne: sender._id },
		disableNotifications: { $ne: true },
		$or: [{ 'userHighlights.0': { $exists: 1 } }, ...(usersInThread.length > 0 ? [{ 'u._id': { $in: usersInThread } }] : [])],
	} as const;

	(['desktop', 'mobile', 'email'] as const).forEach((kind) => {
		const notificationField = kind === 'mobile' ? 'mobilePush' : `${kind}Notifications`;

		query.$or.push({
			[notificationField]: 'all',
			...(disableAllMessageNotifications ? { [`${kind}PrefOrigin`]: { $ne: 'user' } } : {}),
		});

		if (disableAllMessageNotifications) {
			return;
		}

		if (room.t === 'd') {
			query.$or.push({
				[notificationField]: 'mentions',
			});
		} else if (mentionIdsWithoutGroups.length > 0) {
			query.$or.push({
				[notificationField]: 'mentions',
				'u._id': { $in: mentionIdsWithoutGroups },
			});
		}

		const serverField = kind === 'email' ? 'emailNotificationMode' : `${kind}Notifications`;
		const serverPreference = settings.get(`Accounts_Default_User_Preferences_${serverField}`);

		if (serverPreference === 'all' || hasMentionToAll || hasMentionToHere || room.t === 'd') {
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

	const subscriptions = await Subscriptions.col.aggregate<SubscriptionAggregation>([{ $match: query }, lookup, filter, project]).toArray();

	subscriptions.forEach(
		(subscription) =>
			void sendNotification({
				subscription,
				sender,
				hasMentionToAll,
				hasMentionToHere,
				message,
				notificationMessage,
				room,
				mentionIds,
				disableAllMessageNotifications,
				hasReplyToThread: usersInThread?.includes(subscription.u._id),
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

export async function sendAllNotifications(message: IMessage, room: IRoom) {
	if (settings.get<boolean>('Troubleshoot_Disable_Notifications') === true) {
		return message;
	}

	// threads
	if (message.tmid) {
		return message;
	}
	// skips this callback if the message was edited
	if (isEditedMessage(message)) {
		return message;
	}

	if (message.ts && Math.abs(moment(message.ts).diff(new Date())) > 60000) {
		return message;
	}

	if (!room || room.t == null) {
		return message;
	}

	await sendMessageNotifications(message, room);

	return message;
}

settings.watch('Troubleshoot_Disable_Notifications', (value) => {
	if (value) {
		return callbacks.remove('afterSaveMessage', 'sendNotificationsOnMessage');
	}

	callbacks.add(
		'afterSaveMessage',
		(message, { room }) => sendAllNotifications(message, room),
		callbacks.priority.LOW,
		'sendNotificationsOnMessage',
	);
});
