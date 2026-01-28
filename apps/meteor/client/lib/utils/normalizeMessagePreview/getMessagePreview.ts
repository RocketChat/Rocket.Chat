import type { IMessage } from '@rocket.chat/core-typings';
import { isDirectMessageRoom, isE2EEMessage, isMultipleDirectMessageRoom, isVideoConfMessage } from '@rocket.chat/core-typings';
import type { SubscriptionWithRoom } from '@rocket.chat/ui-contexts';
import type { TFunction } from 'i18next';

import { normalizeMessagePreview } from './normalizeMessagePreview';

export const getMessagePreview = (room: SubscriptionWithRoom, lastMessage: IMessage | undefined, t: TFunction): string | undefined => {
	if (!lastMessage) {
		return t('No_messages_yet');
	}
	if (isVideoConfMessage(lastMessage)) {
		return t('Call_started');
	}
	if (isE2EEMessage(lastMessage) && lastMessage.e2e !== 'done') {
		return t('Encrypted_message_preview_unavailable');
	}

	const normalizedMessage = normalizeMessagePreview(lastMessage, t);
	if (!normalizedMessage) {
		return '';
	}

	if (!lastMessage.u) {
		return normalizedMessage;
	}
	if (lastMessage.u?.username === room.u?.username) {
		return `${t('You')}: ${normalizedMessage}`;
	}
	if (isDirectMessageRoom(room) && !isMultipleDirectMessageRoom(room)) {
		return normalizedMessage;
	}
	return `${lastMessage.u.name || lastMessage.u.username}: ${normalizedMessage}`;
};
