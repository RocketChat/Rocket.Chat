import { isOmnichannelRoom, isEditedMessage } from '@rocket.chat/core-typings';
import { LivechatInquiry } from '@rocket.chat/models';

import { callbacks } from '../../../../lib/callbacks';
import { settings } from '../../../settings/server';
import { RoutingManager } from '../lib/RoutingManager';

callbacks.add(
	'afterSaveMessage',
	async (message, room) => {
		if (!isOmnichannelRoom(room) || isEditedMessage(message) || message.t) {
			return message;
		}

		if (!RoutingManager.getConfig()?.showQueue) {
			// since last message is only getting used on UI as preview message when queue is enabled
			return message;
		}

		if (!settings.get('Store_Last_Message')) {
			return message;
		}

		await LivechatInquiry.setLastMessageByRoomId(room._id, message);

		return message;
	},
	callbacks.priority.LOW,
	'save-last-message-to-inquiry',
);
