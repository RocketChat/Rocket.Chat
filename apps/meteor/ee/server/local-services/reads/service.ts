import { Reads, Subscriptions } from '@rocket.chat/models';
import type { ISubscription } from '@rocket.chat/core-typings';
import { ServiceClassInternal } from '@rocket.chat/core-services';

import type { IReadsService } from '../../sdk/types/IReadsService';
import { Messages } from '../../../../app/models/server';
import { ReadReceipt } from '../../lib/message-read-receipt/ReadReceipt';
import { MAX_ROOM_SIZE_CHECK_INDIVIDUAL_READ_RECEIPTS } from '../../lib/constants';

export class ReadsService extends ServiceClassInternal implements IReadsService {
	protected name = 'reads';

	async readThread(userId: string, tmid: string): Promise<void> {
		const read = await Reads.findOneByUserIdAndThreadId(userId, tmid);

		const threadMessage = Messages.findOneById(tmid, { projection: { ts: 1, tlm: 1, rid: 1 } });
		if (!threadMessage || !threadMessage.tlm) {
			return;
		}

		await Reads.updateReadTimestampByUserIdAndThreadId(userId, tmid);
		ReadReceipt.storeThreadMessagesReadReceipts(tmid, userId, read?.ls || threadMessage.ts);

		// doesn't mark as read if not all room members have read the thread
		const membersCount = await Subscriptions.countUnarchivedByRoomId(threadMessage.rid);

		if (membersCount <= MAX_ROOM_SIZE_CHECK_INDIVIDUAL_READ_RECEIPTS) {
			const subscriptions = await Subscriptions.findUnarchivedByRoomId(threadMessage.rid, {
				projection: { 'u._id': 1 },
			}).toArray();
			const members = subscriptions.map((s: ISubscription) => s.u._id);

			const totalReads = await Reads.countByThreadAndUserIds(tmid, members);
			if (totalReads < membersCount) {
				return;
			}
		} else {
			// for large rooms, mark as read if there are as many reads as room members to improve performance (instead of checking each read)
			const totalReads = await Reads.countByThreadId(tmid);
			if (totalReads < membersCount) {
				return;
			}
		}

		const firstRead = await Reads.getMinimumLastSeenByThreadId(tmid);
		if (firstRead?.ls) {
			Messages.setThreadMessagesAsRead(tmid, firstRead.ls);
		}
	}
}
