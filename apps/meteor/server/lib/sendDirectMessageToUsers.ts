import type { IUser } from '@rocket.chat/core-typings';
import { Users } from '@rocket.chat/models';

import { executeSendMessage } from '../../app/lib/server/methods/sendMessage';
import { createDirectMessage } from '../methods/createDirectMessage';
import { SystemLogger } from './logger/system';

export async function sendDirectMessageToUsers(
	fromId = 'rocket.cat',
	toIds: string[],
	messageFn: (user: IUser) => string,
): Promise<string[]> {
	const fromUser = await Users.findOneById(fromId, { projection: { _id: 1, username: 1 } });
	if (!fromUser) {
		throw new Error(`User not found: ${fromId}`);
	}

	const users = Users.findByIds(toIds, { projection: { _id: 1, username: 1, language: 1 } });
	const success: string[] = [];

	for await (const user of users) {
		try {
			const { rid } = await createDirectMessage([user.username], fromId);
			const msg = typeof messageFn === 'function' ? messageFn(user) : messageFn;

			await executeSendMessage(fromId, { rid, msg });
			success.push(user._id);
		} catch (error) {
			SystemLogger.error(error);
		}
	}

	return success;
}
