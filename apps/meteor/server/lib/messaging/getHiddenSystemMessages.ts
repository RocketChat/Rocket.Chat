import type { MessageTypesValues, IRoom } from '@rocket.chat/core-typings';

import { normalizeHiddenSystemMessages } from '../../../lib/systemMessage/normalizeHiddenSystemMessages';

export const getHiddenSystemMessages = (room: IRoom, hiddenSystemMessages: MessageTypesValues[]): MessageTypesValues[] => {
	const hiddenTypes = Array.isArray(room?.sysMes) ? room.sysMes : hiddenSystemMessages;

	return normalizeHiddenSystemMessages(hiddenTypes);
};
