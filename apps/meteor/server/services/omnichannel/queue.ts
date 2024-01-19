import type { InquiryWithAgentInfo, IOmnichannelQueue } from '@rocket.chat/core-typings';
import { License } from '@rocket.chat/license';
import { LivechatInquiry } from '@rocket.chat/models';

import { dispatchAgentDelegated } from '../../../app/livechat/server/lib/Helper';
import { RoutingManager } from '../../../app/livechat/server/lib/RoutingManager';
import { getInquirySortMechanismSetting } from '../../../app/livechat/server/lib/settings';
import { settings } from '../../../app/settings/server';
import { queueLogger } from './logger';

const DEFAULT_RACE_TIMEOUT = 5000;

export class OmnichannelQueue implements IOmnichannelQueue {
	private running = false;

	private queues: (string | undefined)[] = [];

	private delay() {
		const timeout = settings.get<number>('Omnichannel_queue_delay_timeout') ?? 5;
		return timeout < 1 ? DEFAULT_RACE_TIMEOUT : timeout * 1000;
	}

	public isRunning() {
		return this.running;
	}

	async start() {
		if (this.running) {
			return;
		}

		const activeQueues = await this.getActiveQueues();
		queueLogger.debug(`Active queues: ${activeQueues.length}`);
		this.running = true;

		queueLogger.info('Service started');
		return this.execute();
	}

	async stop() {
		await LivechatInquiry.unlockAll();

		this.running = false;
		queueLogger.info('Service stopped');
	}

	private async getActiveQueues() {
		// undefined = public queue(without department)
		return ([undefined] as typeof this.queues).concat(await LivechatInquiry.getDistinctQueuedDepartments({}));
	}

	private async nextQueue() {
		if (!this.queues.length) {
			queueLogger.debug('No more registered queues. Refreshing');
			this.queues = await this.getActiveQueues();
		}

		return this.queues.shift();
	}

	private async execute() {
		if (!this.running) {
			queueLogger.debug('Queue stopped. Cannot execute');
			return;
		}

		if (await License.shouldPreventAction('monthlyActiveContacts', 1)) {
			queueLogger.debug('MAC limit reached. Queue wont execute');
			this.running = false;
			return;
		}

		const queue = await this.nextQueue();
		const queueDelayTimeout = this.delay();
		queueLogger.debug(`Executing queue ${queue || 'Public'} with timeout of ${queueDelayTimeout}`);

		setTimeout(this.checkQueue.bind(this, queue), queueDelayTimeout);
	}

	private async checkQueue(queue: string | undefined) {
		queueLogger.debug(`Processing items for queue ${queue || 'Public'}`);
		try {
			const nextInquiry = await LivechatInquiry.findNextAndLock(getInquirySortMechanismSetting(), queue);
			if (!nextInquiry) {
				queueLogger.debug(`No more items for queue ${queue || 'Public'}`);
				return;
			}

			const result = await this.processWaitingQueue(queue, nextInquiry as InquiryWithAgentInfo);

			if (!result) {
				// Note: this removes the "one-shot" behavior of queue, allowing it to take a conversation again in the future
				// And sorting them by _updatedAt: -1 will make it so that the oldest inquiries are taken first
				// preventing us from playing with the same inquiry over and over again
				return await LivechatInquiry.unlockAndQueue(nextInquiry._id);
			}

			await LivechatInquiry.unlock(nextInquiry._id);
		} catch (e) {
			queueLogger.error({
				msg: 'Error processing queue',
				queue: queue || 'Public',
				err: e,
			});
		} finally {
			void this.execute();
		}
	}

	async shouldStart() {
		if (!settings.get('Livechat_enabled')) {
			void this.stop();
			return;
		}

		const routingSupportsAutoAssign = RoutingManager.getConfig()?.autoAssignAgent;
		queueLogger.debug({
			msg: 'Routing method supports auto assignment',
			method: settings.get('Livechat_Routing_Method'),
			status: routingSupportsAutoAssign ? 'Starting' : 'Stopping',
		});

		void (routingSupportsAutoAssign ? this.start() : this.stop());
	}

	private async processWaitingQueue(department: string | undefined, inquiry: InquiryWithAgentInfo) {
		const queue = department || 'Public';
		queueLogger.debug(`Processing items on queue ${queue}`);

		queueLogger.debug(`Processing inquiry ${inquiry._id} from queue ${queue}`);
		const { defaultAgent } = inquiry;
		const room = await RoutingManager.delegateInquiry(inquiry, defaultAgent);

		const propagateAgentDelegated = async (rid: string, agentId: string) => {
			await dispatchAgentDelegated(rid, agentId);
		};

		if (room?.servedBy) {
			const {
				_id: rid,
				servedBy: { _id: agentId },
			} = room;
			queueLogger.debug(`Inquiry ${inquiry._id} taken successfully by agent ${agentId}. Notifying`);
			setTimeout(() => {
				void propagateAgentDelegated(rid, agentId);
			}, 1000);

			return true;
		}

		queueLogger.debug(`Inquiry ${inquiry._id} not taken by any agent. Queueing again`);
		return false;
	}
}
