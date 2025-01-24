import type { IMessage } from '@rocket.chat/core-typings';
import { Users } from '@rocket.chat/models';

export async function isMessageFromBot(message: IMessage): Promise<boolean> {
	return Users.isUserInRole(message.u._id, 'bot');
}
