import type { MessageTypesValues } from '@rocket.chat/core-typings';

import { isMutedUnmuted, normalizeHiddenSystemMessages } from '../../../lib/systemMessage/normalizeHiddenSystemMessages';

export { isMutedUnmuted };

export const isMessageRemoved = (messageType: string): boolean => messageType === 'rm';

export const shouldHideSystemMessage = (messageType: MessageTypesValues, hideSystemMessage?: MessageTypesValues[]): boolean => {
	if (!hideSystemMessage?.length || isMessageRemoved(messageType)) {
		return false;
	}

	return hideSystemMessage.includes(messageType) || normalizeHiddenSystemMessages(hideSystemMessage).includes(messageType);
};
