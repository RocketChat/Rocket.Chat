import type { IMessage, IRoom, IUser } from '@rocket.chat/core-typings';
import { Subscriptions, Users } from '@rocket.chat/models';

import { shortnameToUnicode } from '../../../app/emoji-native/lib/shortnameToUnicode';
import { callbacks } from '../../lib/callbacks';
import { i18n } from '../../lib/i18n';
import { notifyDesktopUser, shouldNotifyDesktop } from '../../lib/notifications/message/desktop';
import { settings } from '../../settings';

export async function notifyAuthorOnReaction(
	message: IMessage,
	{ user, reaction, room }: { user: IUser; reaction: string; room: IRoom },
): Promise<IMessage> {
	if (user._id === message.u._id) {
		return message;
	}

	const author = await Users.findOneById<Pick<IUser, '_id' | 'language' | 'status' | 'statusConnection' | 'settings'>>(message.u._id, {
		projection: { 'language': 1, 'status': 1, 'statusConnection': 1, 'settings.preferences.receiveReactionNotifications': 1 },
	});
	if (!author) {
		return message;
	}

	const receiveReactionNotifications =
		author.settings?.preferences?.receiveReactionNotifications ??
		settings.get<boolean>('Accounts_Default_User_Preferences_receiveReactionNotifications');
	if (!receiveReactionNotifications) {
		return message;
	}

	const subscription = await Subscriptions.findOneByRoomIdAndUserId(room._id, author._id, {
		projection: { desktopNotifications: 1, disableNotifications: 1, audioNotificationValue: 1 },
	});
	if (!subscription || subscription.disableNotifications) {
		return message;
	}

	if (
		!shouldNotifyDesktop({
			disableAllMessageNotifications: false,
			status: author.status ?? 'offline',
			statusConnection: author.statusConnection ?? 'offline',
			desktopNotifications: subscription.desktopNotifications,
			hasMentionToAll: false,
			hasMentionToHere: false,
			isHighlighted: false,
			hasMentionToUser: false,
			hasReplyToThread: false,
			roomType: room.t,
			isThread: false,
		})
	) {
		return message;
	}

	const reactorName = (settings.get<boolean>('UI_Use_Real_Name') && user.name) || user.username;
	const messageExcerpt = message.msg || i18n.t('Attachment', { lng: author.language });

	await notifyDesktopUser({
		userId: author._id,
		user,
		message,
		room,
		notificationMessage: i18n.t('Reaction_Notification', {
			name: reactorName,
			reaction: shortnameToUnicode(reaction),
			message: messageExcerpt,
			lng: author.language,
		}),
		audioNotificationValue: subscription.audioNotificationValue,
	});

	return message;
}

settings.watch<boolean>('Reaction_Notifications_Enabled', (enabled) => {
	if (!enabled) {
		return callbacks.remove('afterSetReaction', 'notifyAuthorOnReaction');
	}

	callbacks.add('afterSetReaction', notifyAuthorOnReaction, callbacks.priority.LOW, 'notifyAuthorOnReaction');
});
