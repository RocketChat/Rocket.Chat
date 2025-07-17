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

		await ReadReceipt.markMessageAsReadBySender(message, room, message.u._id);

		// mark message as read by deactivated users
		void ReadReceipt.markMessageAsReadByDeactivatedMembers(message, room);

		return message;
	},
	callbacks.priority.MEDIUM,
	'message-read-receipt-afterSaveMessage',
);
