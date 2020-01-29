import { Base } from './_Base';

export class AppsLogsModel extends Base {
	constructor() {
		super('apps_logs');

		this.tryEnsureIndex({ appId: 1 });
		this.tryEnsureIndex({ _updatedAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 30 });
	}

	// Bypass trash collection
	remove(query) {
		return this._db.originals.remove(query);
	}
}
