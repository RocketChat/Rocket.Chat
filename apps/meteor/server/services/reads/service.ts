import { ServiceClassInternal } from '../../sdk/types/ServiceClass';
import type { IReadsService } from '../../sdk/types/IReadsService';
// import { ReadReceipt } from '/imports/message-read-receipt/server/lib/ReadReceipt';

type IRead = {
	_id: string;
	// rid: string;
	tmid: string;
	ls: Date;
	userId: string;
	// following: boolean;
};

export class ReadsService extends ServiceClassInternal implements IReadsService {
	protected name = 'reads';

	readThread(userId: string, tmid: string): Promise<boolean> {
		console.log('received readThread', userId, tmid);

		// Reads.updateOne({
		// 	userId,
		// 	tmid,
		// }, {
		// 	$set: {
		// 		ls: new Date(),
		// 	},
		// }, {
		// 	upsert: true,
		// });

		// const firstSubscription = Subscriptions.getMinimumLastSeenByRoomId(_id);
		// if (!firstSubscription || !firstSubscription.ls) {
		// 	return;
		// }

		// Messages.setAsRead(_id, firstSubscription.ls);

		// if (lm <= firstSubscription.ls) {
		// 	Rooms.setLastMessageAsRead(_id);
		// }

		// ReadReceipt.storeReadReceipts(userId, [tmid]);

		return Promise.resolve(!!tmid);
	}
}
