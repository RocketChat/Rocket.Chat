import { AppConsole } from '@rocket.chat/apps-engine/server/logging';
import { AppLogStorage } from '@rocket.chat/apps-engine/server/storage';
import { InstanceStatus } from '@rocket.chat/instance-status';

export class AppRealLogsStorage extends AppLogStorage {
	constructor(model) {
		super('mongodb');
		this.db = model;
	}

	async find(...args) {
		return this.db.find(...args).toArray();
	}

	async storeEntries(appId, logger) {
		const item = AppConsole.toStorageEntry(appId, logger);

		item.instanceId = InstanceStatus.id();

		const id = (await this.db.insertOne(item)).insertedId;

		return this.db.findOneById(id);
	}

	async getEntriesFor(appId) {
		return this.db.find({ appId }).toArray();
	}

	async removeEntriesFor(appId) {
		await this.db.remove({ appId });
	}
}
