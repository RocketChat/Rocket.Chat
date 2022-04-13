import { Cursor } from 'mongodb';

import { BaseRaw } from './BaseRaw';
import { ReadReceipt } from '../../../../definition/ReadReceipt';

export class ReadReceiptsRaw extends BaseRaw<ReadReceipt> {
	protected modelIndexes() {
		return [{ key: { roomId: 1, userId: 1, messageId: 1 }, unique: true }, { key: { messageId: 1 } }];
	}

	findByMessageId(messageId: string): Cursor<ReadReceipt> {
		return this.find({ messageId });
	}
}
