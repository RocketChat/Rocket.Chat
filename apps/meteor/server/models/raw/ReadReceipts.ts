import type { ReadReceipt, RocketChatRecordDeleted } from '@rocket.chat/core-typings';
import type { IReadReceiptsModel } from '@rocket.chat/model-typings';
import type { Collection, FindCursor, Db, IndexDescription } from 'mongodb';

import { BaseRaw } from './BaseRaw';

export class ReadReceiptsRaw extends BaseRaw<ReadReceipt> implements IReadReceiptsModel {
	constructor(db: Db, trash?: Collection<RocketChatRecordDeleted<ReadReceipt>>) {
		super(db, 'read_receipts', trash);
	}

	protected modelIndexes(): IndexDescription[] {
		return [{ key: { roomId: 1, userId: 1, messageId: 1 }, unique: true }, { key: { messageId: 1 } }];
	}

	findByMessageId(messageId: string): FindCursor<ReadReceipt> {
		return this.find({ messageId });
	}
}
