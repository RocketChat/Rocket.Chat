import type { ILoggerStorageEntry } from '@rocket.chat/apps-engine/server/logging';
import { AppConsole } from '@rocket.chat/apps-engine/server/logging';
import type { IAppLogStorageFindOptions } from '@rocket.chat/apps-engine/server/storage';
import { AppLogStorage } from '@rocket.chat/apps-engine/server/storage';
import type { IAppsLogsModel } from '@rocket.chat/model-typings';
import { InstanceStatus } from '@rocket.chat/instance-status';

export class AppRealLogsStorage extends AppLogStorage {
	constructor(private db: IAppsLogsModel) {
		super('mongodb');
	}

	public async find(
		query: {
			[field: string]: any;
		},
		options?: IAppLogStorageFindOptions,
	): Promise<Array<ILoggerStorageEntry>> {
		return this.db.find(query, { projection: options?.fields || {} }).toArray();
	}

	public async storeEntries(appId: string, logger: AppConsole): Promise<ILoggerStorageEntry> {
		const item = AppConsole.toStorageEntry(appId, logger);

		item.instanceId = InstanceStatus.id();

		const id = (await this.db.insertOne(item)).insertedId;

		return this.db.findOneById(id);
	}

	public async getEntriesFor(appId: string): Promise<Array<ILoggerStorageEntry>> {
		return this.db.find({ appId }).toArray();
	}

	public async removeEntriesFor(appId: string): Promise<void> {
		await this.db.remove({ appId });
	}
}
