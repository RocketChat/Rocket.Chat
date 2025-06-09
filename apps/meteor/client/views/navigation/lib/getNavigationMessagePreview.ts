import type { IMessage } from '@rocket.chat/core-typings';
import { isDirectMessageRoom, isMultipleDirectMessageRoom, isVideoConfMessage } from '@rocket.chat/core-typings';
import type { SubscriptionWithRoom } from '@rocket.chat/ui-contexts';
import type { TFunction } from 'i18next';

import { normalizeNavigationMessage } from './normalizeNavigationMessage';

export const getNavigationMessagePreview = (
	room: SubscriptionWithRoom,
	lastMessage: IMessage | undefined,
	t: TFunction,
): string | undefined => {
	if (!lastMessage) {
		return t('No_messages_yet');
	}
	if (isVideoConfMessage(lastMessage)) {
		return t('Call_started');
	}
	if (!lastMessage.u) {
		return normalizeNavigationMessage(lastMessage, t);
	}
	if (lastMessage.u?.username === room.u?.username) {
		return `${t('You')}: ${normalizeNavigationMessage(lastMessage, t)}`;
	}
	if (isDirectMessageRoom(room) && !isMultipleDirectMessageRoom(room)) {
		return normalizeNavigationMessage(lastMessage, t);
	}
	return `${lastMessage.u.name || lastMessage.u.username}: ${normalizeNavigationMessage(lastMessage, t)}`;
};
