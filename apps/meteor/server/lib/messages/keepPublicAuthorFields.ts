import type { IMessage } from '@rocket.chat/core-typings';
import { pick } from '@rocket.chat/tools';

export const keepPublicAuthorFields = <T extends Pick<IMessage, 'u'>>(message: T): T => {
	if (message.u) {
		message.u = pick(message.u, '_id', 'username', 'name');
	}
	return message;
};
