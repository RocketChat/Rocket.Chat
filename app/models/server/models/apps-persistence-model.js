import { Base } from './_Base';

export class AppsPersistenceModel extends Base {
	constructor() {
		super('apps_persistence');

		this.tryEnsureIndex({ appId: 1 });
	}

	// Bypass trash collection
	remove(query) {
		return this._db.originals.remove(query);
	}
}
