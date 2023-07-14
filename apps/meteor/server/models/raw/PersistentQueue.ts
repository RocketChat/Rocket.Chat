import type { Db, IndexDescription } from 'mongodb';
import type { IPersistentQueueModel } from '@rocket.chat/model-typings';
import type { IPersistentQueue } from '@rocket.chat/core-typings';

import { BaseRaw } from './BaseRaw';

export class PersistentQueueModel extends BaseRaw<IPersistentQueue> implements IPersistentQueueModel {
	constructor(db: Db) {
		super(db, 'queue');
	}

	modelIndexes(): IndexDescription[] {
		return [
			{ key: { type: 1 } },
			{ key: { rejectedTime: 1 }, sparse: true },
			{ key: { nextReceivableTime: 1 }, sparse: true },
			{ key: { receivedTime: 1 }, sparse: true },
		];
	}
}
