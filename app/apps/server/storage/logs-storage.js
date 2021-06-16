import { AppConsole } from '@rocket.chat/apps-engine/server/logging';
import { AppLogStorage } from '@rocket.chat/apps-engine/server/storage';
import { InstanceStatus } from 'meteor/konecty:multiple-instances-status';

export class AppRealLogsStorage extends AppLogStorage {
	constructor(model) {
		super('mongodb');
		this.db = model;
	}

	async find(...args) {
		return this.db.find(...args).fetch();
	}

	async storeEntries(appId, logger) {
		const item = AppConsole.toStorageEntry(appId, logger);

		item.instanceId = InstanceStatus.id();

		this.db.insert(item);

		return item;
	}

	async getEntriesFor(appId) {
		return this.db.find({ appId }).fetch();
	}

	async removeEntriesFor(appId) {
		return this.db.remove({ appId });
	}
}
