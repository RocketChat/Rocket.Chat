import type { ILoggerStorageEntry } from '@rocket.chat/apps-engine/server/logging';
import { AppConsole } from '@rocket.chat/apps-engine/server/logging';
import type { IAppLogStorageFindOptions } from '@rocket.chat/apps-engine/server/storage';
import { AppLogStorage } from '@rocket.chat/apps-engine/server/storage';
import type { IAppsLogsModel } from '@rocket.chat/model-typings';

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

		const { insertedId } = await this.db.insertOne(item);

		const entry = await this.db.findOne({ _id: insertedId });

		if (!entry) {
			throw new Error(`Could not find log entry ${insertedId}`);
		}

		return entry;
	}

	public async getEntriesFor(appId: string): Promise<Array<ILoggerStorageEntry>> {
		return this.db.find({ appId }).toArray();
	}

	public async removeEntriesFor(appId: string): Promise<void> {
		await this.db.deleteOne({ appId });
	}
}
