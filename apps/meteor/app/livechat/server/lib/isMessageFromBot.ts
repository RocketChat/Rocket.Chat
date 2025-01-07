import type { IMessage, IUser } from '@rocket.chat/core-typings';
import { Users } from '@rocket.chat/models';

export async function isMessageFromBot(message: IMessage): Promise<boolean> {
	const user = await Users.findOneById<Pick<IUser, 'roles'>>(message.u._id, { projection: { roles: 1 } });

	if (!user) {
		throw new Error('User not found');
	}

	return !!user.roles.includes('bot');
}
