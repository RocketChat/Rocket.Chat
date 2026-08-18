import type { MessageTypesValues } from '@rocket.chat/core-typings';

const hiddenSystemMessageGroups: Partial<Record<MessageTypesValues, readonly MessageTypesValues[]>> = {
	mute_unmute: ['user-muted', 'user-unmuted'],
};

export const normalizeHiddenSystemMessages = (hiddenSystemMessages: readonly MessageTypesValues[]): MessageTypesValues[] =>
	hiddenSystemMessages.flatMap((messageType) => {
		const groupedMessageTypes = hiddenSystemMessageGroups[messageType];
		return groupedMessageTypes ? [...groupedMessageTypes] : [messageType];
	});

export const isMutedUnmuted = (messageType: string): boolean =>
	hiddenSystemMessageGroups.mute_unmute?.some((groupedMessageType) => groupedMessageType === messageType) ?? false;
