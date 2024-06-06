import type { MessageTypesValues, IRoom } from '@rocket.chat/core-typings';

export const getHiddenSystemMessages = async (room: IRoom, hiddenSystemMessages: MessageTypesValues[]): Promise<MessageTypesValues[]> => {
	return Array.isArray(room?.sysMes) ? room.sysMes : [...hiddenSystemMessages];
};
