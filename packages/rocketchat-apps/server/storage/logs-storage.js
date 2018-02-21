import { AppConsole } from '@rocket.chat/apps-engine/server/logging';
import { AppLogStorage } from '@rocket.chat/apps-engine/server/storage';

export class AppRealLogsStorage extends AppLogStorage {
	constructor(model) {
		super('mongodb');
		this.db = model;
	}

	find() {
		return new Promise((resolve, reject) => {
			let docs;

			try {
				docs = this.db.find(...arguments).fetch();
			} catch (e) {
				return reject(e);
			}

			resolve(docs);
		});
	}

	storeEntries(appId, logger) {
		console.log(appId);
		return new Promise((resolve, reject) => {
			const item = AppConsole.toStorageEntry(appId, logger);

			try {
				console.log(item);
				const id = this.db.insert(item);
				console.log(id);

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
}
