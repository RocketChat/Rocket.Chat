import { AppConsole } from '@rocket.chat/apps-engine/server/logging';
import type { ILoggerStorageEntry } from '@rocket.chat/apps-engine/server/logging';
import { AppLogStorage } from '@rocket.chat/apps-engine/server/storage';
import { InstanceStatus } from '@rocket.chat/instance-status';
import type { AppLogs } from '@rocket.chat/models';

export class AppRealLogStorage extends AppLogStorage {
	constructor(private db: typeof AppLogs) {
		super('mongodb');
	}

	async find(...args: any): Promise<ILoggerStorageEntry[]> {
		return this.db.find(...args).toArray();
	}

	async storeEntries(appId: string, logger: AppConsole): Promise<ILoggerStorageEntry> {
		const item = AppConsole.toStorageEntry(appId, logger);

		item.instanceId = InstanceStatus.id();

		const id = (await this.db.insertOne(item)).insertedId;

		return this.db.findOneById(id);
	}

	async getEntriesFor(appId: string): Promise<ILoggerStorageEntry[]> {
		return this.db.find({ appId }).toArray();
	}

	async removeEntriesFor(appId: string): Promise<void> {
		await this.db.remove({ appId });
	}
}
