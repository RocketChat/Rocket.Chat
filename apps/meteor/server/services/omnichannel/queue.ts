import type { IOmnichannelRoom } from '@rocket.chat/core-typings';
import { type InquiryWithAgentInfo, type IOmnichannelQueue } from '@rocket.chat/core-typings';
import { License } from '@rocket.chat/license';
import { LivechatInquiry, LivechatRooms } from '@rocket.chat/models';

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
		if (!this.running) {
			return;
		}

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

		void this.checkQueue(queue).catch((e) => {
			queueLogger.error(e);
		});
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
				queueLogger.debug(`Inquiry ${nextInquiry._id} not taken. Unlocking and re-queueing`);
				return await LivechatInquiry.unlockAndQueue(nextInquiry._id);
			}

			queueLogger.debug(`Inquiry ${nextInquiry._id} taken successfully. Unlocking`);
			await LivechatInquiry.unlock(nextInquiry._id);
			queueLogger.debug({
				msg: 'Inquiry processed',
				inquiry: nextInquiry._id,
				queue: queue || 'Public',
				result,
			});
		} catch (e) {
			queueLogger.error({
				msg: 'Error processing queue',
				queue: queue || 'Public',
				err: e,
			});
		} finally {
			setTimeout(this.execute.bind(this), this.delay());
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

	private async reconciliation(reason: 'closed' | 'taken' | 'missing', { roomId, inquiryId }: { roomId: string; inquiryId: string }) {
		switch (reason) {
			case 'closed': {
				queueLogger.debug({
					msg: 'Room closed. Removing inquiry',
					roomId,
					inquiryId,
					step: 'reconciliation',
				});
				await LivechatInquiry.removeByRoomId(roomId);
				break;
			}
			case 'taken': {
				queueLogger.debug({
					msg: 'Room taken. Updating inquiry status',
					roomId,
					inquiryId,
					step: 'reconciliation',
				});
				// Reconciliate served inquiries, by updating their status to taken after queue tried to pick and failed
				await LivechatInquiry.takeInquiry(inquiryId);
				break;
			}
			case 'missing': {
				queueLogger.debug({
					msg: 'Room from inquiry missing. Removing inquiry',
					roomId,
					inquiryId,
					step: 'reconciliation',
				});
				await LivechatInquiry.removeByRoomId(roomId);
				break;
			}
			default: {
				return true;
			}
		}

		return true;
	}

	private async processWaitingQueue(department: string | undefined, inquiry: InquiryWithAgentInfo) {
		const queue = department || 'Public';

		queueLogger.debug(`Processing inquiry ${inquiry._id} from queue ${queue}`);
		const { defaultAgent } = inquiry;

		const roomFromDb = await LivechatRooms.findOneById<Pick<IOmnichannelRoom, '_id' | 'servedBy' | 'closedAt'>>(inquiry.rid, {
			projection: { servedBy: 1, closedAt: 1 },
		});

		// This is a precaution to avoid taking inquiries tied to rooms that no longer exist.
		// This should never happen.
		if (!roomFromDb) {
			return this.reconciliation('missing', { roomId: inquiry.rid, inquiryId: inquiry._id });
		}

		// This is a precaution to avoid taking the same inquiry multiple times. It should not happen, but it's a safety net
		if (roomFromDb.servedBy) {
			return this.reconciliation('taken', { roomId: inquiry.rid, inquiryId: inquiry._id });
		}

		// This is another precaution. If the room is closed, we should not take it
		if (roomFromDb.closedAt) {
			return this.reconciliation('closed', { roomId: inquiry.rid, inquiryId: inquiry._id });
		}

		const room = await RoutingManager.delegateInquiry(inquiry, defaultAgent);

		if (room?.servedBy) {
			const {
				_id: rid,
				servedBy: { _id: agentId },
			} = room;
			queueLogger.debug(`Inquiry ${inquiry._id} taken successfully by agent ${agentId}. Notifying`);
			setTimeout(() => {
				void dispatchAgentDelegated(rid, agentId);
			}, 1000);

			return true;
		}

		return false;
	}
}
