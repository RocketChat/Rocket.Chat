import type { IServiceClass } from '../../../../apps/meteor/server/sdk/types/ServiceClass';
import { ServiceClass } from '../../../../apps/meteor/server/sdk/types/ServiceClass';
import { initWatchers } from '../../../../apps/meteor/server/modules/watchers/watchers.module';
import type { DatabaseWatcher } from '../../../../apps/meteor/server/database/DatabaseWatcher';

export class StreamHub extends ServiceClass implements IServiceClass {
	protected name = 'hub';

	constructor(private watcher: DatabaseWatcher) {
		super();
	}

	async created(): Promise<void> {
		initWatchers(this.watcher, this.api.broadcast.bind(this.api));

		this.watcher.watch();
	}
}
