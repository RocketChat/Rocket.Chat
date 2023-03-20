import type { IUser, IReport } from '@rocket.chat/core-typings';
import { Messages } from '@rocket.chat/models';

import { deleteMessage } from '../../../app/lib/server/functions/deleteMessage';

export async function deleteReportedMessages(msgData: Pick<IReport, '_id' | 'message' | 'ts' | 'room'>[], user: IUser): Promise<void> {
	const promises = msgData.map(async (msg) => {
		const deletedMsg = await Messages.findOneById(msg.message._id);
		if (!deletedMsg) {
			return Promise.resolve();
		}
		return deleteMessage(deletedMsg, user);
	});
	await Promise.all(promises);
}
