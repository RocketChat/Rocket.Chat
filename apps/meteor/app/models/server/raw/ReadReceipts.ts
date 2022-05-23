import { Cursor } from 'mongodb';
import { ReadReceipt } from '@rocket.chat/core-typings';

import { BaseRaw, IndexSpecification } from './BaseRaw';

export class ReadReceiptsRaw extends BaseRaw<ReadReceipt> {
	protected modelIndexes(): IndexSpecification[] {
		return [{ key: { roomId: 1, userId: 1, messageId: 1 }, unique: true }, { key: { messageId: 1 } }];
	}

	findByMessageId(messageId: string): Cursor<ReadReceipt> {
		return this.find({ messageId });
	}
}
