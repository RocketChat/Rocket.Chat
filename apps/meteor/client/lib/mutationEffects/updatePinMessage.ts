import type { IMessage } from '@rocket.chat/core-typings';

import { Messages } from '../../../app/models/client';
import { PinMessagesNotAllowed } from '../errors/PinMessagesNotAllowed';

export const updatePinMessage = (message: IMessage, data: Partial<IMessage>) => {
	Messages.update(
		{
			_id: message._id,
			rid: message.rid,
		},
		{ $set: data },
	);

	const msg = Messages.findOne({ _id: message._id });

	if (!msg) {
		throw new PinMessagesNotAllowed('Error pinning message', {
			method: 'pinMessage',
		});
	}
};
