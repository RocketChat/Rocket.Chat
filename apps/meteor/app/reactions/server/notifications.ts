import { Subscriptions, Users } from '@rocket.chat/models';

import { emoji } from '../../emoji/server';
import { notifyDesktopUser, shouldNotifyDesktop } from '../../lib/server/functions/notifications/desktop';
import { settings } from '../../settings/server';
import { callbacks } from '../../../server/lib/callbacks';
import { i18n } from '../../../server/lib/i18n';
import { SystemLogger } from '../../../server/lib/logger/system';

callbacks.add(
	'afterSetReaction',
	async (message, { user, reaction, room }) => {
		try {
			if (settings.get<boolean>('Troubleshoot_Disable_Notifications') === true) {
				return;
			}

			if (!settings.get<boolean>('Reaction_Notifications_Enabled')) {
				return;
			}

			if (!message.u?._id || message.u._id === user._id) {
				return;
			}

			const recipient = await Users.findOneById(message.u._id, {
				projection: {
					'active': 1,
					'status': 1,
					'statusConnection': 1,
					'language': 1,
					'settings.preferences.receiveReactionNotifications': 1,
				},
			});

			if (!recipient || !recipient.active) {
				return;
			}

			const receiveReactionNotifications =
				recipient.settings?.preferences?.receiveReactionNotifications ??
				settings.get<boolean>('Accounts_Default_User_Preferences_receiveReactionNotifications');

			if (!receiveReactionNotifications) {
				return;
			}

			const subscription = await Subscriptions.findOneByRoomIdAndUserId(room._id, recipient._id, {
				projection: { desktopNotifications: 1, disableNotifications: 1, audioNotificationValue: 1 },
			});

			if (!subscription || subscription.disableNotifications) {
				return;
			}

			if (
				!shouldNotifyDesktop({
					disableAllMessageNotifications: false,
					status: recipient.status ?? 'offline',
					statusConnection: recipient.statusConnection ?? 'offline',
					desktopNotifications: subscription.desktopNotifications,
					hasMentionToAll: false,
					hasMentionToHere: false,
					isHighlighted: false,
					hasMentionToUser: true,
					hasReplyToThread: false,
					roomType: room.t,
					isThread: false,
				})
			) {
				return;
			}

			const useRealName = settings.get<boolean>('UI_Use_Real_Name');
			const reactorName = (useRealName && user.name) || user.username;

			const emojione = (emoji.packages as any).emojione;
			const emojiActual =
				(emojione &&
					(emoji.list[reaction] as any)?.uc_output &&
					emojione.convert((emoji.list[reaction] as any).uc_output.toUpperCase())) ||
				reaction;
			const msgText = message.msg || i18n.t('Attachment', { lng: recipient.language });

			const notificationMessage = i18n.t('Reaction_Notification', {
				name: reactorName,
				reaction: emojiActual,
				message: msgText,
				lng: recipient.language || settings.get<string>('Language') || 'en',
			});

			await notifyDesktopUser({
				userId: recipient._id,
				user,
				message,
				room,
				notificationMessage,
				audioNotificationValue: subscription.audioNotificationValue,
			});
		} catch (e) {
			SystemLogger.error({ msg: 'Error sending reaction notification', err: e });
		}
	},
	callbacks.priority.LOW,
	'ReactionNotification',
);
