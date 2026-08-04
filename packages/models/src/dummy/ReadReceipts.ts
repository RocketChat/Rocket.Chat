import type { IReadReceipt } from '@rocket.chat/core-typings';
import type { IReadReceiptsModel } from '@rocket.chat/model-typings';
import type { FindCursor, DeleteResult } from 'mongodb';

import { BaseDummy } from './BaseDummy';

export class ReadReceiptsDummy extends BaseDummy<IReadReceipt> implements IReadReceiptsModel {
	constructor() {
		super('read_receipts');
	}

	findByMessageId(_messageId: string): FindCursor<IReadReceipt> {
		return this.find({});
	}

	removeByUserId(_userId: string): Promise<DeleteResult> {
		return this.deleteMany({});
	}

	removeByRoomId(_roomId: string): Promise<DeleteResult> {
		return this.deleteMany({});
	}

	removeByRoomIds(_roomIds: string[]): Promise<DeleteResult> {
		return this.deleteMany({});
	}

	removeByMessageId(_messageId: string): Promise<DeleteResult> {
		return this.deleteMany({});
	}

	removeByMessageIds(_messageIds: string[]): Promise<DeleteResult> {
		return this.deleteMany({});
	}

	findOlderThan(_date: Date): FindCursor<IReadReceipt> {
		return this.find({});
	}
}
