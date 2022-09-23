import type { Db } from 'mongodb';

import type { IServiceClass } from '../../../../apps/meteor/server/sdk/types/ServiceClass';
import { ServiceClass } from '../../../../apps/meteor/server/sdk/types/ServiceClass';
import { initWatchers } from '../../../../apps/meteor/server/modules/watchers/watchers.module';
import { DatabaseWatcher } from '../../../../apps/meteor/server/database/DatabaseWatcher';

export class StreamHub extends ServiceClass implements IServiceClass {
	protected name = 'hub';

	constructor(private db: Db) {
		super();
	}

	async created(): Promise<void> {
		const watcher = new DatabaseWatcher({ db: this.db });

		initWatchers(watcher, this.api.broadcast.bind(this.api));

		watcher.watch();
	}
}
