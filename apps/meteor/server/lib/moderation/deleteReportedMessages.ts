import type { IUser, IReport } from '@rocket.chat/core-typings';
import { Messages } from '@rocket.chat/models';

import { deleteMessage } from '../../../app/lib/server/functions/deleteMessage';

export async function deleteReportedMessages(messages: Pick<IReport, '_id' | 'message' | 'ts' | 'room'>[], user: IUser): Promise<void> {
	const promises = messages.map(async (message) => {
		const deletedMsg = await Messages.findOneById(message._id);
		if (!deletedMsg) {
			return Promise.resolve();
		}
		return deleteMessage(deletedMsg, user);
	});
	await Promise.all(promises);
}
