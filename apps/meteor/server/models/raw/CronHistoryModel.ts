import type { ICronHistoryItem } from '@rocket.chat/core-typings';
import type { ICronHistoryModel } from '@rocket.chat/model-typings';
import type { Db, IndexDescription } from 'mongodb';

import { BaseRaw } from './BaseRaw';

export class CronHistoryRaw extends BaseRaw<ICronHistoryItem> implements ICronHistoryModel {
	constructor(db: Db) {
		super(db, 'cron_history');
	}

	protected modelIndexes(): IndexDescription[] {
		return [{ key: { intendedAt: 1, name: 1 }, unique: true }];
	}
}
