import type { ILoggerStorageEntry } from '@rocket.chat/apps-engine/server/logging';
import type { IAppsLogsModel } from '@rocket.chat/model-typings';
import type { Db, Filter, IndexDescription } from 'mongodb';

import { BaseRaw } from './BaseRaw';

export class AppsLogsRaw extends BaseRaw<ILoggerStorageEntry> implements IAppsLogsModel {
	constructor(db: Db) {
		super(db, 'apps_logs');
	}

	protected modelIndexes(): IndexDescription[] {
		return [{ key: { _updatedAt: 1 }, expireAfterSeconds: 60 * 60 * 24 * 30 }];
	}

	resetTTLIndex(expireAfterSeconds: number) {
		this.tryDropIndex('_updatedAt');
		this.tryEnsureIndex({ _updatedAt: 1 }, { expireAfterSeconds });
	}
}
