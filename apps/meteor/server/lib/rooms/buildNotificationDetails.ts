import { getUserDisplayName } from '@rocket.chat/core-typings';
import type { AtLeast, IRoom, IUser } from '@rocket.chat/core-typings';

import { settings } from '../../../app/settings/server';
import { i18n } from '../i18n';

/**
 * Options for building notification details.
 */
export type BuildNotificationDetailsOptions = {
	/** The message to display for the notification. */
	expectedNotificationMessage: string;
	/** The precomputed title for the notification. */
	expectedTitle?: string;
	/** The room object with at least a name property. */
	room: AtLeast<IRoom, 'name'>;
	/** The user sending the notification. */
	sender: AtLeast<IUser, '_id' | 'name' | 'username'>;
	/** Optional language code used for translation (defaults to server setting or 'en'). */
	language?: string;
	/** Whether to prefix the message with senderName: (defaults to false). */
	senderNameExpectedInMessage?: boolean;
};

/**
 * Builds the notification payload fields (title, text, name) based on settings and provided expectations.
 *
 * @param options - Precomputed values and context for the notification.
 * @returns An object containing the notification title, text, and user/room label.
 */
export function buildNotificationDetails({
	expectedNotificationMessage,
	expectedTitle,
	room,
	sender,
	language,
	senderNameExpectedInMessage = false,
}: BuildNotificationDetailsOptions): { title?: string; text: string; name?: string } {
	const showPushMessage = settings.get<boolean>('Push_show_message');
	const showUserOrRoomName = settings.get<boolean>('Push_show_username_room');

	let text: string;
	if (showPushMessage) {
		if (senderNameExpectedInMessage && showUserOrRoomName) {
			const useRealName = settings.get<boolean>('UI_Use_Real_Name');
			const senderName = getUserDisplayName(sender.name, sender.username, useRealName);
			text = `${senderName}: ${expectedNotificationMessage}`;
		} else {
			text = expectedNotificationMessage;
		}
	} else {
		const lng = language || settings.get('Language') || 'en';
		text = i18n.t('You_have_a_new_message', { lng });
	}

	let title: string | undefined;
	let name: string | undefined;
	if (showUserOrRoomName) {
		name = room.name;
		title = expectedTitle;
	}

	return { title, text, name };
}
