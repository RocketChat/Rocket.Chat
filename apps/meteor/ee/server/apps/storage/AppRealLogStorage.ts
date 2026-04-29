import type { ILoggerStorageEntry } from '@rocket.chat/apps/dist/server/logging/ILoggerStorageEntry';
import type { IAppLogStorageFindOptions } from '@rocket.chat/apps/dist/server/storage/AppLogStorage';
import { AppLogStorage } from '@rocket.chat/apps/dist/server/storage/AppLogStorage';
import { InstanceStatus } from '@rocket.chat/instance-status';
import type { AppLogs } from '@rocket.chat/models';

import { redact } from '../lib/redactor';

export class AppRealLogStorage extends AppLogStorage {
	constructor(private db: typeof AppLogs) {
		super('mongodb');
	}

	async find(
		query: {
			[field: string]: any;
		},
		options: IAppLogStorageFindOptions,
	) {
		return this.db.find<ILoggerStorageEntry>(query, options).toArray();
	}

	async findPaginated(
		query: {
			[field: string]: any;
		},
		options: IAppLogStorageFindOptions,
	) {
		const { cursor, totalCount } = this.db.findPaginated<ILoggerStorageEntry>(query, options);

		const [logs, total] = await Promise.all([cursor.toArray(), totalCount]);

		return {
			logs,
			total,
		};
	}

	async distinctValues(appId: string) {
		return this.db.getDistinctFieldsForFilters(appId);
	}

	async storeEntries(logEntry: ILoggerStorageEntry): Promise<ILoggerStorageEntry> {
		logEntry.instanceId = InstanceStatus.id();

		logEntry.entries.forEach((entry) => {
			entry.args.forEach(redact);
		});

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
