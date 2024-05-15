import type { IServiceClass } from '@rocket.chat/core-services';
import { ServiceClass } from '@rocket.chat/core-services';
import type { Logger } from '@rocket.chat/logger';

import type { DatabaseWatcher } from '../../../../apps/meteor/server/database/DatabaseWatcher';
import { initWatchers } from '../../../../apps/meteor/server/modules/watchers/watchers.module';

export class StreamHub extends ServiceClass implements IServiceClass {
	protected name = 'hub';

	private logger: Logger;

	constructor(private watcher: DatabaseWatcher, loggerClass: typeof Logger) {
		super();

		// eslint-disable-next-line new-cap
		this.logger = new loggerClass('StreamHub');
	}

	async created(): Promise<void> {
		if (!this.api) {
			return;
		}

		this.api.metrics?.register({
			name: 'rocketchat_oplog',
			type: 'counter',
			labelNames: ['collection', 'op'],
			description: 'summary of oplog operations',
		});

		this.watcher.onDocument(({ collection, doc }) => {
			this.api?.metrics?.increment('rocketchat_oplog', { collection, op: doc.action });
		});

		initWatchers(this.watcher, this.api.broadcast.bind(this.api));

		try {
			await this.watcher.watch();
		} catch (err: unknown) {
			this.logger.fatal(err, 'Fatal error occurred when watching database');
			process.exit(1);
		}
	}
}
