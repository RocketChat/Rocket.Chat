import { isEditedMessage } from '@rocket.chat/core-typings';

import { callbacks } from '../../../../../lib/callbacks';
import { ReadReceipt } from '../../../../server/lib/message-read-receipt/ReadReceipt';

callbacks.add(
	'afterSaveMessage',
	async (message, { room }) => {
		// skips this callback if the message was edited
		if (isEditedMessage(message)) {
			return message;
		}

		// mark message as read as well
		await ReadReceipt.markMessageAsReadBySender(message, room, message.u._id);

		return message;
	},
	callbacks.priority.MEDIUM,
	'message-read-receipt-afterSaveMessage',
);
