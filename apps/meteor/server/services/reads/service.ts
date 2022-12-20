import { Reads } from '@rocket.chat/models';

import { ServiceClassInternal } from '../../sdk/types/ServiceClass';
import type { IReadsService } from '../../sdk/types/IReadsService';
import { Messages } from '../../../app/models/server';
import { ReadReceipt } from '../../../imports/message-read-receipt/server/lib/ReadReceipt';

export class ReadsService extends ServiceClassInternal implements IReadsService {
	protected name = 'reads';

	async readThread(userId: string, tmid: string): Promise<void> {
		const read = await Reads.findOneByUserIdAndThreadId(userId, tmid);
		console.log('read', read);

		const now = new Date();
		console.log('now', now);

		await Reads.updateOne(
			{
				userId,
				tmid,
			},
			{
				$set: {
					ls: now,
				},
			},
			{
				upsert: true,
			},
		);

		const threadMessage = Messages.findOneById(tmid, { projection: { ts: 1, tlm: 1, replies: 1 } });
		console.log('threadMessage', threadMessage);
		if (!threadMessage || !threadMessage.tlm) {
			return;
		}

		ReadReceipt.storeThreadMessagesReadReceipts(tmid, userId, read?.ls || threadMessage.ts);

		// doesn't mark as read if not all followers have read the thread
		const totalReads = await Reads.col.countDocuments({ tmid, userId: { $in: threadMessage.replies } });
		console.log('totalReads ->', totalReads);
		console.log('threadMessage.replies.length ->', threadMessage.replies.length);
		if (totalReads < threadMessage.replies.length) {
			return;
		}

		const firstRead = await Reads.getMinimumLastSeenByThreadId(tmid);
		console.log('firstRead', firstRead);
		if (firstRead && firstRead.ls) {
			Messages.setThreadMessagesAsRead(tmid, firstRead.ls);
		}
	}
}
