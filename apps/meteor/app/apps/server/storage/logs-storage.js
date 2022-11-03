import { AppConsole } from '@rocket.chat/apps-engine/server/logging';
import { AppLogStorage } from '@rocket.chat/apps-engine/server/storage';
import { InstanceStatus } from 'meteor/konecty:multiple-instances-status';

export class AppRealLogsStorage extends AppLogStorage {
	constructor(model) {
		super('mongodb');
		this.db = model;
	}

	find(...args) {
		return new Promise((resolve, reject) => {
			let docs;

			try {
				docs = this.db.find(...args).fetch();
			} catch (e) {
				return reject(e);
			}

			resolve(docs);
		});
	}

	storeEntries(appId, logger) {
		return new Promise((resolve, reject) => {
			const item = AppConsole.toStorageEntry(appId, logger);

			item.instanceId = InstanceStatus.id();

			try {
				const id = this.db.insert(item);

				resolve(this.db.findOneById(id));
			} catch (e) {
				reject(e);
			}
		});
	}

	getEntriesFor(appId) {
		return new Promise((resolve, reject) => {
			let docs;

			try {
				docs = this.db.find({ appId }).fetch();
			} catch (e) {
				return reject(e);
			}

			resolve(docs);
		});
	}

	removeEntriesFor(appId) {
		return new Promise((resolve, reject) => {
			try {
				this.db.remove({ appId });
			} catch (e) {
				return reject(e);
			}

			resolve();
		});
	}
}
