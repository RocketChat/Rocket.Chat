import type { ILoggerStorageEntry } from '@rocket.chat/apps-engine/server/logging';
import type { IAppLogStorageFindOptions } from '@rocket.chat/apps-engine/server/storage';
import { AppLogStorage } from '@rocket.chat/apps-engine/server/storage';
import { InstanceStatus } from '@rocket.chat/instance-status';
import type { AppLogs } from '@rocket.chat/models';

export class AppRealLogStorage extends AppLogStorage {
	constructor(private db: typeof AppLogs) {
		super('mongodb');
	}

	async find(
		query: {
			[field: string]: any;
		},
		options?: IAppLogStorageFindOptions,
	): Promise<ILoggerStorageEntry[]> {
		return this.db.find({ ...options, ...query }).toArray();
	}

	async storeEntries(logEntry: ILoggerStorageEntry): Promise<ILoggerStorageEntry> {
		logEntry.instanceId = InstanceStatus.id();

		const id = (await this.db.insertOne(logEntry)).insertedId;

		return this.db.findOneById(id);
	}

	async getEntriesFor(appId: string): Promise<ILoggerStorageEntry[]> {
		return this.db.find({ appId }).toArray();
	}

	async removeEntriesFor(appId: string): Promise<void> {
		await this.db.deleteOne({ appId });
	}
}
