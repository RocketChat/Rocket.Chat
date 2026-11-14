import type { MessageTypesValues, IRoom } from '@rocket.chat/core-typings';

import { expandSystemMessageOptions } from '../../../lib/expandSystemMessageOptions';

export const getHiddenSystemMessages = (room: Pick<IRoom, 'sysMes'>, hiddenSystemMessages: MessageTypesValues[]): MessageTypesValues[] => {
	return [...expandSystemMessageOptions(Array.isArray(room?.sysMes) ? room.sysMes : hiddenSystemMessages)];
};
