import type { Cursor, IndexSpecification } from 'mongodb';
import type { ReadReceipt } from '@rocket.chat/core-typings';
import type { IReadReceiptsModel } from '@rocket.chat/model-typings';

import { ModelClass } from './ModelClass';

export class ReadReceiptsRaw extends ModelClass<ReadReceipt> implements IReadReceiptsModel {
	protected modelIndexes(): IndexSpecification[] {
		return [{ key: { roomId: 1, userId: 1, messageId: 1 }, unique: true }, { key: { messageId: 1 } }];
	}

	findByMessageId(messageId: string): Cursor<ReadReceipt> {
		return this.find({ messageId });
	}
}
