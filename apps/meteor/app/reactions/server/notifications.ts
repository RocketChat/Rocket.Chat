import { Subscriptions, Users } from '@rocket.chat/models';

import { callbacks } from '../../../server/lib/callbacks';
import { i18n } from '../../../server/lib/i18n';
import { notifyOnSubscriptionChangedByRoomIdAndUserId } from '../../lib/server/lib/notifyListener';
import { settings } from '../../settings/server';
import { notifyDesktopUser } from '../../lib/server/functions/notifications/desktop';
import { emoji } from '../../emoji/server';
import { SystemLogger } from '../../../server/lib/logger/system';

callbacks.add(
	'afterSetReaction',
	async (message, { user, reaction, room }) => {
		try {
			if (settings.get<boolean>('Troubleshoot_Disable_Notifications') === true) {
				return;
			}

			if (!message.u?._id || message.u._id === user._id) {
				return;
			}

			const recipient = await Users.findOneById(message.u._id, {
				projection: {
					'active': 1,
					'settings.preferences.receiveReactionNotifications': 1,
					'language': 1,
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

			await Subscriptions.incReactionsForRoomIdAndUserIds(room._id, [recipient._id], 1);
			void notifyOnSubscriptionChangedByRoomIdAndUserId(room._id, recipient._id);

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
			});
		} catch (e) {
			SystemLogger.error({ msg: 'Error sending reaction notification', err: e });
		}
	},
	callbacks.priority.LOW,
	'RecordReactionNotification',
);

callbacks.add(
	'afterUnsetReaction',
	async (message, { user, room }) => {
		try {
			if (settings.get<boolean>('Troubleshoot_Disable_Notifications') === true) {
				return;
			}

			if (!message.u?._id || message.u._id === user._id) {
				return;
			}

			const recipient = await Users.findOneById(message.u._id, {
				projection: {
					'active': 1,
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

			const recipientId = message.u._id;

			await Subscriptions.updateOne(
				{
					rid: room._id,
					'u._id': recipientId,
					reactions: { $gt: 0 },
				},
				{
					$inc: { reactions: -1 },
				},
			);

			void notifyOnSubscriptionChangedByRoomIdAndUserId(room._id, recipientId);
		} catch (e) {
			SystemLogger.error({ msg: 'Error handling reaction notification removal', err: e });
		}
	},
	callbacks.priority.LOW,
	'RecordReactionNotificationRemoval',
);
