import type { MessageTypesValues } from '@rocket.chat/core-typings';

export const isMutedUnmuted = (messageType: string): boolean => {
	return messageType === 'user-muted' || messageType === 'user-unmuted';
};

export const shouldHideSystemMessage = (messageType: MessageTypesValues, hideSystemMessage?: MessageTypesValues[]): boolean => {
	if (!hideSystemMessage?.length) {
		return false;
	}

	return hideSystemMessage.includes(messageType) || (isMutedUnmuted(messageType) && hideSystemMessage.includes('mute_unmute'));
};
