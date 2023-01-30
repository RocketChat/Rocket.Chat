import { Reads } from '@rocket.chat/models';
import type { ISubscription } from '@rocket.chat/core-typings';
import { ServiceClassInternal } from '@rocket.chat/core-services';

import type { IReadsService } from '../../sdk/types/IReadsService';
import { Messages, Subscriptions } from '../../../../app/models/server';
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
		const subscriptions = await Subscriptions.findByRoomId(threadMessage.rid, {
			fields: { 'u._id': 1 },
		});
		const members = subscriptions.map((s: ISubscription) => !s?.archived && s.u?._id);

		if (members.length <= MAX_ROOM_SIZE_CHECK_INDIVIDUAL_READ_RECEIPTS) {
			const totalReads = await Reads.countByThreadAndUserIds(tmid, members);
			if (totalReads < members.length) {
				return;
			}
		} else {
			// for large rooms, mark as read if there are as many reads as room members to improve performance (instead of checking each read)
			const totalReads = await Reads.countByThreadId(tmid);
			if (totalReads < members.length) {
				return;
			}
		}

		const firstRead = await Reads.getMinimumLastSeenByThreadId(tmid);
		if (firstRead?.ls) {
			Messages.setThreadMessagesAsRead(tmid, firstRead.ls);
		}
	}
}
