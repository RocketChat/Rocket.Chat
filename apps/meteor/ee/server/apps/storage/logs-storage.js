import { AppConsole } from '@rocket.chat/apps-engine/server/logging';
import { AppLogStorage } from '@rocket.chat/apps-engine/server/storage';
import { InstanceStatus } from '@rocket.chat/instance-status';

export class AppRealLogsStorage extends AppLogStorage {
	constructor(model) {
		super('mongodb');
		this.db = model;
	}

	async find(...args) {
		try {
			return this.db.find(...args).toArray();
		} catch (e) {
			throw e;
		}
	}

	async storeEntries(appId, logger) {
		const item = AppConsole.toStorageEntry(appId, logger);

		item.instanceId = InstanceStatus.id();

		try {
			const id = await this.db.insertOne(item);

			return this.db.findOneById(id);
		} catch (e) {
			throw e;
		}
	}

	async getEntriesFor(appId) {
		let docs;

		try {
			docs = await this.db.find({ appId }).toArray();
		} catch (e) {
			throw e;
		}

		return docs;
	}

	async removeEntriesFor(appId) {
		try {
			await this.db.deleteOne({ appId });
		} catch (e) {
			throw e;
		}
	}
}
