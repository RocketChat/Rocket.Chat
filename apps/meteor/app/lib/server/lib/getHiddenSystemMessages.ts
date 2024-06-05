import type { MessageTypesValues, IRoom } from '@rocket.chat/core-typings';

import { getCachedHiddenSystemMessage } from '../../../../server/lib/systemMessage/hideSystemMessage';

export const getHiddenSystemMessages = async (room: IRoom): Promise<MessageTypesValues[]> => {
	const cachedHiddenSystemMessage = await getCachedHiddenSystemMessage();
	return Array.isArray(room?.sysMes) ? room.sysMes : [...cachedHiddenSystemMessage];
};
