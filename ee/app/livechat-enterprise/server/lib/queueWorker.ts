
import { UpdateWriteOpResult } from 'mongodb';

import { LivechatInquiry, OmnichannelQueue } from '../../../../../app/models/server/raw';
import { processWaitingQueue } from './Helper';
import { RoutingManager } from '../../../../../app/livechat/server/lib/RoutingManager';
import { settings } from '../../../../../app/settings/server';
import { queueLogger } from './logger';


const DEFAULT_RACE_TIMEOUT = 5000;
let queueDelayTimeout = DEFAULT_RACE_TIMEOUT;

const queueWorker = {
	running: false,
	queues: [] as (string | undefined)[],
	async start(): Promise<void> {
		queueLogger.debug('Starting queue');
		if (this.running) {
			queueLogger.debug('Queue already running');
			return;
		}

		const activeQueues = await this.getActiveQueues();
		queueLogger.debug(`Active queues: ${ activeQueues.length }`);

		await OmnichannelQueue.initQueue();
		this.running = true;
		return this.execute();
	},
	async stop(): Promise<UpdateWriteOpResult> {
		queueLogger.debug('Stopping queue');
		this.running = false;
		return OmnichannelQueue.stopQueue();
	},
	async getActiveQueues(): Promise<(string | undefined)[]> {
		// undefined = public queue(without department)
		return [undefined, ...await LivechatInquiry.getDistinctQueuedDepartments({})];
	},
	async nextQueue(): Promise<string | undefined> {
		if (!this.queues.length) {
			queueLogger.debug('No more registered queues. Refreshing');
			this.queues = await this.getActiveQueues();
		}

		return this.queues.shift();
	},
	async execute(): Promise<void> {
		if (!this.running) {
			queueLogger.debug('Queue stopped. Cannot execute');
			return;
		}

		const queue = await this.nextQueue();
		queueLogger.debug(`Executing queue ${ queue || 'Public' } with timeout of ${ queueDelayTimeout }`);

		setTimeout(this.checkQueue.bind(this, queue), queueDelayTimeout);
	},

	async checkQueue(queue: string | undefined): Promise<void> {
		queueLogger.debug(`Processing items for queue ${ queue || 'Public' }`);
		try {
			if (await OmnichannelQueue.lockQueue()) {
				await processWaitingQueue(queue);
				queueLogger.debug(`Queue ${ queue || 'Public' } processed. Unlocking`);
				await OmnichannelQueue.unlockQueue();
			} else {
				queueLogger.debug('Queue locked. Waiting');
			}
		} catch (e) {
			queueLogger.error({
				msg: `Error processing queue ${ queue || 'public' }`,
				err: e,
			});
		} finally {
			this.execute();
		}
	},
};


let omnichannelIsEnabled = false;
function shouldQueueStart(): void {
	if (!omnichannelIsEnabled) {
		queueWorker.stop();
		return;
	}

	const routingSupportsAutoAssign = RoutingManager.getConfig().autoAssignAgent;
	queueLogger.debug(`Routing method ${ RoutingManager.methodName } supports auto assignment: ${ routingSupportsAutoAssign }. ${
		routingSupportsAutoAssign
			? 'Starting'
			: 'Stopping'
	} queue`);

	routingSupportsAutoAssign ? queueWorker.start() : queueWorker.stop();
}

RoutingManager.startQueue = shouldQueueStart;

settings.watch('Livechat_enabled', (enabled: boolean) => {
	omnichannelIsEnabled = enabled;
	omnichannelIsEnabled && RoutingManager.isMethodSet() ? shouldQueueStart() : queueWorker.stop();
});

settings.watch('Omnichannel_queue_delay_timeout', (timeout: number) => {
	queueDelayTimeout = timeout < 1 ? DEFAULT_RACE_TIMEOUT : timeout * 1000;
});
