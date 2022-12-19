import type { IServiceClass } from '../../../../apps/meteor/server/sdk/types/ServiceClass';
import { ServiceClass } from '../../../../apps/meteor/server/sdk/types/ServiceClass';
import { initWatchers } from '../../../../apps/meteor/server/modules/watchers/watchers.module';
import type { DatabaseWatcher } from '../../../../apps/meteor/server/database/DatabaseWatcher';
import type { Logger } from '../../../../apps/meteor/server/lib/logger/Logger';

export class StreamHub extends ServiceClass implements IServiceClass {
	protected name = 'hub';

	private logger: Logger;

	constructor(private watcher: DatabaseWatcher, loggerClass: typeof Logger) {
		super();

		// eslint-disable-next-line new-cap
		this.logger = new loggerClass('StreamHub');
	}

	async created(): Promise<void> {
		initWatchers(this.watcher, this.api.broadcast.bind(this.api));

		try {
			await this.watcher.watch();
		} catch (err: unknown) {
			this.logger.fatal(err, 'Fatal error occurred when watching database');
			process.exit(1);
		}
	}
}
