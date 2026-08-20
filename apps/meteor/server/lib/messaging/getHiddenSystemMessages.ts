import type { MessageTypesValues, IRoom } from '@rocket.chat/core-typings';

export const getHiddenSystemMessages = (room: Pick<IRoom, 'sysMes'>, hiddenSystemMessages: MessageTypesValues[]): MessageTypesValues[] => {
	const hiddenTypes = hiddenSystemMessages.reduce((array, value): MessageTypesValues[] => {
		const newValue: MessageTypesValues[] = value === 'mute_unmute' ? ['user-muted', 'user-unmuted'] : [value];
		return [...array, ...newValue];
	}, [] as MessageTypesValues[]);

	return Array.isArray(room?.sysMes) ? room.sysMes : hiddenTypes;
};
