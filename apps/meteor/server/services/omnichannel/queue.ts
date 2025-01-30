import { ServiceStarter } from '@rocket.chat/core-services';
import { type InquiryWithAgentInfo, type IOmnichannelQueue } from '@rocket.chat/core-typings';
import { License } from '@rocket.chat/license';
import { LivechatInquiry, LivechatRooms } from '@rocket.chat/models';
import { tracerSpan } from '@rocket.chat/tracing';

import { queueLogger } from './logger';
import { getOmniChatSortQuery } from '../../../app/livechat/lib/inquiries';
import { dispatchAgentDelegated } from '../../../app/livechat/server/lib/Helper';
import { RoutingManager } from '../../../app/livechat/server/lib/RoutingManager';
import { getInquirySortMechanismSetting } from '../../../app/livechat/server/lib/settings';
import { settings } from '../../../app/settings/server';

const DEFAULT_RACE_TIMEOUT = 5000;

export class OmnichannelQueue implements IOmnichannelQueue {
	private serviceStarter: ServiceStarter;

	private timeoutHandler: ReturnType<typeof setTimeout> | null = null;

	constructor() {
		this.serviceStarter = new ServiceStarter(
			() => this._start(),
			() => this._stop(),
		);
	}

	private running = false;

	private delay() {
		const timeout = settings.get<number>('Omnichannel_queue_delay_timeout') ?? 5;
		return timeout < 1 ? DEFAULT_RACE_TIMEOUT : timeout * 1000;
	}

	public isRunning() {
		return this.running;
	}

	private async _start() {
		if (this.running) {
			return;
		}

		const activeQueues = await this.getActiveQueues();
		queueLogger.debug(`Active queues: ${activeQueues.length}`);
		this.running = true;

		queueLogger.info('Service started');
		return this.execute();
	}

	private async _stop() {
		if (!this.running) {
			return;
		}

		await LivechatInquiry.unlockAll();

		this.running = false;

		if (this.timeoutHandler !== null) {
			clearTimeout(this.timeoutHandler);
			this.timeoutHandler = null;
		}

		queueLogger.info('Service stopped');
	}

	async start() {
		return this.serviceStarter.start();
	}

	async stop() {
		return this.serviceStarter.stop();
	}

	private async getActiveQueues() {
		return (await LivechatInquiry.getDistinctQueuedDepartments({})).map(({ _id }) => _id);
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

		// We still go 1 by 1, but we go with every queue every cycle instead of just 1 queue per cycle
		// And we get tracing :)
		const queues = await this.getActiveQueues();
		for await (const queue of queues) {
			await tracerSpan(
				'omnichannel.queue',
				{ attributes: { workerTime: new Date().toISOString(), queue: queue || 'Public' }, root: true },
				() => this.checkQueue(queue),
			);
		}
		this.scheduleExecution();
	}

	private async checkQueue(queue: string | null) {
		queueLogger.debug(`Processing items for queue ${queue || 'Public'}`);
		try {
			const nextInquiry = await LivechatInquiry.findNextAndLock(getOmniChatSortQuery(getInquirySortMechanismSetting()), queue);
			if (!nextInquiry) {
				queueLogger.debug(`No more items for queue ${queue || 'Public'}`);
				return;
			}

			const result = await this.processWaitingQueue(queue, nextInquiry as InquiryWithAgentInfo);

			if (!result) {
				queueLogger.debug(`Inquiry ${nextInquiry._id} not taken. Unlocking and re-queueing`);
				return await LivechatInquiry.unlock(nextInquiry._id);
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
		}
	}

	private scheduleExecution(): void {
		if (this.timeoutHandler !== null) {
			return;
		}

		this.timeoutHandler = setTimeout(() => {
			this.timeoutHandler = null;
			return this.execute();
		}, this.delay());
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

	private async processWaitingQueue(department: string | null, inquiry: InquiryWithAgentInfo) {
		const queue = department || 'Public';

		queueLogger.debug(`Processing inquiry ${inquiry._id} from queue ${queue}`);
		const { defaultAgent } = inquiry;

		const roomFromDb = await LivechatRooms.findOneById(inquiry.rid);

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

		const room = await RoutingManager.delegateInquiry(inquiry, defaultAgent, undefined, roomFromDb);

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
