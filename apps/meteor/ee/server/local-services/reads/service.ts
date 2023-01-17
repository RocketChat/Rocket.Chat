import { Reads } from '@rocket.chat/models';
import type { ISubscription } from '@rocket.chat/core-typings';
import { ServiceClassInternal } from '@rocket.chat/core-services';

import type { IReadsService } from '../../sdk/types/IReadsService';
import { Messages, Subscriptions } from '../../../../app/models/server';
import { ReadReceipt } from '../../lib/message-read-receipt/ReadReceipt';

export class ReadsService extends ServiceClassInternal implements IReadsService {
	protected name = 'reads';

	async readThread(userId: string, tmid: string): Promise<void> {
		const read = await Reads.findOneByUserIdAndThreadId(userId, tmid);

		await Reads.updateReadTimestampByUserIdAndThreadId(userId, tmid);

		const threadMessage = Messages.findOneById(tmid, { projection: { ts: 1, tlm: 1, rid: 1 } });
		if (!threadMessage || !threadMessage.tlm) {
			return;
		}

		ReadReceipt.storeThreadMessagesReadReceipts(tmid, userId, read?.ls || threadMessage.ts);

		// doesn't mark as read if not all room members have read the thread
		const subscriptions = await Subscriptions.findByRoomId(threadMessage.rid, {
			fields: { 'u._id': 1 },
		});
		const members = subscriptions.map((s: ISubscription) => s.u?._id);

		const totalReads = await Reads.col.countDocuments({ tmid, userId: { $in: members } });
		if (totalReads < members.length) {
			return;
		}

		const firstRead = await Reads.getMinimumLastSeenByThreadId(tmid);
		if (firstRead?.ls) {
			Messages.setThreadMessagesAsRead(tmid, firstRead.ls);
		}
	}
}
