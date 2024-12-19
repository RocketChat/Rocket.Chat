import type { IMessage } from '@rocket.chat/core-typings';
import { Users } from '@rocket.chat/models';

export async function isMessageFromBot(message: IMessage): Promise<boolean> {
	const roles = await Users.findOneById(message.u._id, { projection: { roles: 1 } });
	return !!roles?.include('bot');
}
