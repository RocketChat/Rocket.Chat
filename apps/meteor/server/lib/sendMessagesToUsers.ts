import type { IUser, IMessage } from '@rocket.chat/core-typings';
import { Users } from '@rocket.chat/models';

import { SystemLogger } from './logger/system';
import { executeSendMessage } from '../../app/lib/server/methods/sendMessage';
import { createDirectMessage } from '../methods/createDirectMessage';
import { getData } from './sendMessagesToAdmins';

export async function sendMessagesToUsers(
	fromId = 'rocket.cat',
	toIds: string[],
	msgs: Partial<IMessage>[] | ((params: { adminUser: IUser }) => Partial<IMessage>[]),
): Promise<void> {
	const fromUser = await Users.findOneById(fromId, { projection: { _id: 1 } });
	if (!fromUser) {
		throw new Error(`User not found: ${fromId}`);
	}

	const users = await Users.findByIds(toIds, { projection: { _id: 1, username: 1, language: 1 } }).toArray();

	users.forEach((user) => {
		try {
			const { rid } = createDirectMessage([user.username], fromId);

			getData<Partial<IMessage>>(msgs, user).forEach((msg) => {
				executeSendMessage(fromId, Object.assign({ rid }, msg));
			});
		} catch (error) {
			SystemLogger.error(error);
		}
	});
}
