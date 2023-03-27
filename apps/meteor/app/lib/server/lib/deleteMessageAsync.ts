import type { IMessage, IUser } from '@rocket.chat/core-typings';
import { Users } from '@rocket.chat/models';

import { canDeleteMessageAsync } from '../../../authorization/server/functions/canDeleteMessage';
import { Messages } from '../../../models/server';
import { deleteMessage } from '../functions';

export const deleteMessageAsync = async (message: IMessage, userId: IUser['_id']) => {
	if (typeof message._id !== 'string') {
		throw new Error('error-invalid-message_id');
	}

	if (!userId) {
		throw new Error('error-invalid-user');
	}

	const originalMessage = Messages.findOneById(message._id, {
		fields: {
			u: 1,
			rid: 1,
			file: 1,
			files: 1,
			ts: 1,
		},
	});

	if (!originalMessage || !(await canDeleteMessageAsync(userId, originalMessage))) {
		throw new Error('error-action-not-allowed');
	}

	const user = await Users.findOneById(userId);

	return deleteMessage(originalMessage, user as IUser);
};
