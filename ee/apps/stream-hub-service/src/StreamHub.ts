import type { IServiceClass } from '@rocket.chat/core-services';
import { ServiceClass } from '@rocket.chat/core-services';
import type { Logger } from '@rocket.chat/logger';
import type { DatabaseWatcher } from '@rocket.chat/models';

import { initWatchers } from '../../../../apps/meteor/server/modules/watchers/watchers.module';

export class StreamHub extends ServiceClass implements IServiceClass {
	protected name = 'hub';

	private logger: Logger;

	constructor(
		private watcher: DatabaseWatcher,
		loggerClass: typeof Logger,
	) {
		super();

		// eslint-disable-next-line new-cap
		this.logger = new loggerClass('StreamHub');
	}

	async created(): Promise<void> {
		if (!this.api) {
			return;
		}
		initWatchers(this.watcher, this.api.broadcast.bind(this.api));

		try {
			await this.watcher.watch();
		} catch (err: unknown) {
			this.logger.fatal(err, 'Fatal error occurred when watching database');
			process.exit(1);
		}
	}
}
