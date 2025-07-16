import type { IMessage } from '@rocket.chat/core-typings';

import { Messages } from '../../../app/models/client';
import { PinMessagesNotAllowed } from '../errors/PinMessagesNotAllowed';

export const updatePinMessage = (message: IMessage, data: Partial<IMessage>) => {
	const msg = Messages.state.get(message._id);

	if (!msg) {
		throw new PinMessagesNotAllowed('Error pinning message', {
			method: 'pinMessage',
		});
	}

	Messages.state.update(
		(record) => record._id === message._id && record.rid === message.rid,
		(record) => ({ ...record, ...data }),
	);
};
