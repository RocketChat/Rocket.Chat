import type { CallHistoryItem } from '@rocket.chat/core-typings';
import type { ICallHistoryModel } from '@rocket.chat/model-typings';
import type { Db, IndexDescription } from 'mongodb';

import { BaseRaw } from './BaseRaw';

export class CallHistoryRaw extends BaseRaw<CallHistoryItem> implements ICallHistoryModel {
	constructor(db: Db) {
		super(db, 'call_history');
	}

	protected override modelIndexes(): IndexDescription[] {
		return [{ key: { uid: 1, callId: 1 }, unique: true }, { key: { uid: 1, ts: -1 } }];
	}
}
