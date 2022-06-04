import type { Cursor, IndexSpecification } from 'mongodb';
import type { ReadReceipt } from '@rocket.chat/core-typings';

import { ModelClass } from './ModelClass';

export class ReadReceipts extends ModelClass<ReadReceipt> {
	protected modelIndexes(): IndexSpecification[] {
		return [{ key: { roomId: 1, userId: 1, messageId: 1 }, unique: true }, { key: { messageId: 1 } }];
	}

	findByMessageId(messageId: string): Cursor<ReadReceipt> {
		return this.find({ messageId });
	}
}
