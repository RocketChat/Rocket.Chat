import { Omnichannel } from '@rocket.chat/core-services';
import { isEditedMessage } from '@rocket.chat/core-typings';

import { callbacks } from '../../../../lib/callbacks';

callbacks.add('beforeSaveMessage', async (message, room) => {
	if (!room || room.t !== 'l') {
		return message;
	}

	if (isEditedMessage(message)) {
		return message;
	}

	if (message.token) {
		return message;
	}

	const canSendMessage = await Omnichannel.isRoomEnabled(room);
	if (!canSendMessage) {
		throw new Error('error-mac-limit-reached');
	}

	return message;
});
