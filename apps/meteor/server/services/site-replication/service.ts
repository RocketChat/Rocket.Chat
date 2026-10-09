import { ServiceClassInternal } from '@rocket.chat/core-services';
import { Logger } from '@rocket.chat/logger';
import { Messages } from '@rocket.chat/models';
import { SiteReplicator, rocketChatPolicies } from '@rocket.chat/site-replication';
import type { Logger as ReplicationLogger } from '@rocket.chat/site-replication';
import type { Db, MongoClient } from 'mongodb';

import type { SiteReplicationConfig } from './config';
import { notifyReplicatedChanges } from './notifier';

const toReplicationLogger = (logger: Logger): ReplicationLogger => ({
	debug: (msg, extra) => logger.debug({ msg, ...extra }),
	info: (msg, extra) => logger.info({ msg, ...extra }),
	warn: (msg, extra) => logger.warn({ msg, ...extra }),
	error: (msg, extra) => logger.error({ msg, ...extra }),
});

/** Keeps this workspace's data converging with a peer site that runs the same workspace from its own database. */
export class SiteReplicationService extends ServiceClassInternal {
	protected name = 'site-replication';

	private replicator: SiteReplicator | undefined;

	constructor(
		private readonly config: SiteReplicationConfig,
		private readonly client: MongoClient,
		private readonly db: Db,
	) {
		super();
	}

	override async started(): Promise<void> {
		const { config } = this;
		this.replicator = new SiteReplicator({
			client: this.client,
			db: this.db,
			site: config.site,
			siteName: config.siteName,
			peer: config.peer,
			secret: config.secret,
			listen: config.listen,
			policies: rocketChatPolicies({ localSettings: config.localSettings }),
			messagesCollection: Messages.getCollectionName(),
			notifier: notifyReplicatedChanges,
			partitionThresholdMs: config.partitionThresholdMs,
			logger: toReplicationLogger(new Logger('SiteReplication')),
		});
		await this.replicator.start();
	}

	override async stopped(): Promise<void> {
		await this.replicator?.stop();
		this.replicator = undefined;
	}
}
