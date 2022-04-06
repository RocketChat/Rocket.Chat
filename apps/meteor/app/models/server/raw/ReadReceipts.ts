import { Cursor } from 'mongodb';

import { BaseRaw, IndexSpecification } from './BaseRaw';
import { ReadReceipt } from '@rocket.chat/core-typings';

export class ReadReceiptsRaw extends BaseRaw<ReadReceipt> {
	protected indexes: IndexSpecification[] = [{ key: { roomId: 1, userId: 1, messageId: 1 }, unique: true }, { key: { messageId: 1 } }];

	findByMessageId(messageId: string): Cursor<ReadReceipt> {
		return this.find({ messageId });
	}
}
