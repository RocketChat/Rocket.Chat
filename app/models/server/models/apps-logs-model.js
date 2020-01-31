import { Base } from './_Base';

export class AppsLogsModel extends Base {
	constructor() {
		super('apps_logs', { _updatedAtIndexOptions: { expireAfterSeconds: 60 * 60 * 24 * 30 } });

		this.tryEnsureIndex({ appId: 1 });
	}

	// Bypass trash collection
	remove(query) {
		return this._db.originals.remove(query);
	}
}
