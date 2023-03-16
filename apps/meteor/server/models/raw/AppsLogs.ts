import type { ILoggerStorageEntry } from '@rocket.chat/apps-engine/server/logging';
import type { IAppsLogsModel } from '@rocket.chat/model-typings';
import type { Db, IndexDescription } from 'mongodb';

import { BaseRaw } from './BaseRaw';

export class AppsLogsRaw extends BaseRaw<ILoggerStorageEntry> implements IAppsLogsModel {
	constructor(db: Db) {
		super(db, 'apps_logs');
	}

	protected modelIndexes(): IndexDescription[] {
		return [{ key: { _updatedAt: 1 }, expireAfterSeconds: 60 * 60 * 24 * 30 }];
	}

	async resetTTLIndex(expireAfterSeconds: number): Promise<void> {
		this.tryDropIndex('_updatedAt').catch((e) => console.error(`Could not drop _updatedAt index on apps_logs collection: ${e}`));
		this.tryEnsureIndex({ _updatedAt: 1 }, { expireAfterSeconds }).catch((e) =>
			console.error(`Could not create _updatedAt index on apps_logs collection: ${e}`),
		);
	}
}
