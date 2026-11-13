import type { IMessage } from '@rocket.chat/core-typings';
import { pick } from '@rocket.chat/tools';

/**
 * Keeps only the author's public identity on messages sent to clients.
 */
export const keepPublicAuthorFields = <T extends Pick<IMessage, 'u'>>(message: T): T => {
	if (message.u) {
		message.u = pick(message.u, '_id', 'username', 'name');
	}
	return message;
};
