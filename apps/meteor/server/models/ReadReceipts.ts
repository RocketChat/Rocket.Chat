import type { Cursor, IndexSpecification } from 'mongodb';
import type { ReadReceipt } from '@rocket.chat/core-typings';
import type { IReadReceiptsModel } from '@rocket.chat/model-typings';
import { registerModel } from '@rocket.chat/models';

import { ModelClass } from './ModelClass';
import { trashCollection } from '../database/trash';
import { db, prefix } from '../database/utils';

export class ReadReceipts extends ModelClass<ReadReceipt> implements IReadReceiptsModel {
	protected modelIndexes(): IndexSpecification[] {
		return [{ key: { roomId: 1, userId: 1, messageId: 1 }, unique: true }, { key: { messageId: 1 } }];
	}

	findByMessageId(messageId: string): Cursor<ReadReceipt> {
		return this.find({ messageId });
	}
}

const col = db.collection(`${prefix}read_receipts`);
registerModel('IReadReceiptsModel', new ReadReceipts(col, trashCollection) as IReadReceiptsModel);
