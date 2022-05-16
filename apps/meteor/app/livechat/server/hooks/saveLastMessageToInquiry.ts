import { isOmnichannelRoom, isEditedMessage } from '@rocket.chat/core-typings';

import { callbacks } from '../../../../lib/callbacks';
import { LivechatInquiry } from '../../../models/server/raw';
import { settings } from '../../../settings/server';
import { RoutingManager } from '../lib/RoutingManager';

callbacks.add(
	'afterSaveMessage',
	(message, room) => {
		if (!isOmnichannelRoom(room)) {
			return message;
		}

		// skip callback if message was edited
		if (isEditedMessage(message)) {
			return message;
		}

		if (!RoutingManager.getConfig().showQueue) {
			// since last message is only getting used on UI as preview message when queue is enabled
			return message;
		}

		if (!settings.get('Store_Last_Message')) {
			return message;
		}

		Promise.await(LivechatInquiry.setLastMessageByRoomId(room._id, message));

		return message;
	},
	callbacks.priority.LOW,
	'save-last-message-to-inquiry',
);
