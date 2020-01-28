import { Base } from './_Base';

export class AppsLogsModel extends Base {
	constructor() {
		super('apps_logs');
	}

	// Bypass trash collection
	remove(query) {
		return this._db.originals.remove(query);
	}
}
