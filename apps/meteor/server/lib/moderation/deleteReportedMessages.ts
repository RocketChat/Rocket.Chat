import type { IMessage, IUser } from '@rocket.chat/core-typings';

import { deleteMessage } from '../../../app/lib/server/functions/deleteMessage';

export async function deleteReportedMessages(messages: IMessage[], userId: IUser): Promise<void> {
	const promises = messages.map((message) => deleteMessage(message, userId));
	await Promise.all(promises);
}
