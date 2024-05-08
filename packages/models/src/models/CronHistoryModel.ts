import type { ICronHistoryItem } from '@rocket.chat/core-typings';
import type { ICronHistoryModel } from '@rocket.chat/model-typings';
import type { IndexDescription } from 'mongodb';

import { BaseRaw } from './BaseRaw';

export class CronHistoryRaw extends BaseRaw<ICronHistoryItem> implements ICronHistoryModel {
	constructor() {
		super('cron_history');
	}

	protected modelIndexes(): IndexDescription[] {
		return [{ key: { intendedAt: 1, name: 1 }, unique: true }];
	}
}
