import type { ICronJobItem } from '@rocket.chat/core-typings';
import type { IOmnichannelSchedulerModel } from '@rocket.chat/model-typings';
import type { Db, IndexDescription } from 'mongodb';

import { BaseRaw } from './BaseRaw';

export class OmnichannelSchedulerRaw extends BaseRaw<ICronJobItem> implements IOmnichannelSchedulerModel {
	constructor(db: Db, collectionName: string) {
		super(db, collectionName, undefined, {
			preventSetUpdatedAt: true,
			collectionNameResolver(name) {
				return name;
			},
		});
	}

	protected override modelIndexes(): IndexDescription[] {
		return [{ key: { status: 1, name: 1 } }];
	}
}
