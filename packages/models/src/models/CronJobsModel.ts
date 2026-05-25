import type { ICronJobItem } from '@rocket.chat/core-typings';
import type { ICronJobsModel } from '@rocket.chat/model-typings';
import type { Db } from 'mongodb';

import { BaseRaw } from './BaseRaw';

export class CronJobsRaw extends BaseRaw<ICronJobItem> implements ICronJobsModel {
	constructor(db: Db) {
		super(db, 'cron', undefined, {
			preventSetUpdatedAt: true,
		});
	}
}