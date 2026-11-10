import { ClientSafeError } from '@rocket.chat/core-services';
import type { MessageTypesValues } from '@rocket.chat/core-typings';
import { Rooms } from '@rocket.chat/models';

import { MessageTypesValues as messageTypesValues } from '../../../../lib/MessageTypes';

export const saveRoomSystemMessages = async function (rid: string, systemMessages: MessageTypesValues[]) {
	if (systemMessages?.some((value) => !messageTypesValues.map(({ key }) => key).includes(value))) {
		throw new ClientSafeError('invalid-room', 'Invalid option', {
			function: 'RocketChat.saveRoomSystemMessages',
		});
	}
	return Rooms.setSystemMessagesById(rid, systemMessages);
};
