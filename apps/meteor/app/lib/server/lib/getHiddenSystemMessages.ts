import type { MessageTypesValues, IRoom } from '@rocket.chat/core-typings';

export const getHiddenSystemMessages = (room: IRoom, hiddenSystemMessages: MessageTypesValues[]): MessageTypesValues[] => {
	return Array.isArray(room?.sysMes) ? room.sysMes : [...hiddenSystemMessages];
};
