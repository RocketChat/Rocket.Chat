import type { MessageTypesValues, IRoom } from '@rocket.chat/core-typings';

import { expandSystemMessageOptions } from '../systemMessage/hideSystemMessage';

export const getHiddenSystemMessages = (room: Pick<IRoom, 'sysMes'>, hiddenSystemMessages: MessageTypesValues[]): MessageTypesValues[] => {
	return Array.isArray(room?.sysMes) ? room.sysMes : [...expandSystemMessageOptions(hiddenSystemMessages)];
};
