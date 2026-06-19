import type { ICronJobItem } from '@rocket.chat/core-typings';
import type { IAppSchedulerModel } from '@rocket.chat/model-typings';
import type { Db } from 'mongodb';

import { BaseRaw } from './BaseRaw';

export class AppSchedulerRaw extends BaseRaw<ICronJobItem> implements IAppSchedulerModel {
	constructor(db: Db) {
		super(db, 'apps_scheduler', undefined, {
			preventSetUpdatedAt: true,
		});
	}
}
