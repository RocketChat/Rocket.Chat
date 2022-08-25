import type { IInstanceStatus } from '@rocket.chat/core-typings';
import type { IInstanceStatusModel } from '@rocket.chat/model-typings';
import type { Db } from 'mongodb';

import { BaseRaw } from './BaseRaw';

export class InstanceStatusRaw extends BaseRaw<IInstanceStatus> implements IInstanceStatusModel {
	constructor(db: Db) {
		super(db, 'instances', undefined, {
			preventSetUpdatedAt: true,
			collectionNameResolver(name) {
				return name;
			},
		});
	}

	async getActiveInstanceCount(): Promise<number> {
		return this.col.countDocuments({ _updatedAt: { $gt: new Date(Date.now() - process.uptime() * 1000 - 2000) } });
	}
}
