import { ServiceClassInternal } from '../../sdk/types/ServiceClass';
import type { IReadsService } from '../../sdk/types/IReadsService';
import { Reads } from '@rocket.chat/models';
import { Messages } from '../../../app/models/server';
import { ReadReceipt } from '../../../imports/message-read-receipt/server/lib/ReadReceipt';

export class ReadsService extends ServiceClassInternal implements IReadsService {
	protected name = 'reads';

	async readThread(userId: string, tmid: string): Promise<void> {
		const read = await Reads.findOneByUserIdAndThreadId(userId, tmid);
		Reads.updateOne({
		 	userId,
		 	tmid,
		}, {
		 	$set: {
		 		ls: new Date(),
		 	},
		}, {
		 	upsert: true,
		});

		const threadMessage = Messages.findOneById(tmid);
		if (!threadMessage || !threadMessage.tlm) {
			return;
		}

		ReadReceipt.storeThreadMessagesReadReceipts(tmid, userId, read?.ls || threadMessage.ts);

		const firstRead = await Reads.getMinimumLastSeenByThreadId(tmid);
		if (firstRead && firstRead.ls) {
			Messages.setThreadMessagesAsRead(tmid, firstRead.ls);
		}
	}
}
