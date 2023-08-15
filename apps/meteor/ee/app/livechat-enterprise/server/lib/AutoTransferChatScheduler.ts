import { Agenda } from '@rocket.chat/agenda';
import type { IUser } from '@rocket.chat/core-typings';
import type { MainLogger } from '@rocket.chat/logger';
import { LivechatRooms, Users } from '@rocket.chat/models';
import { Meteor } from 'meteor/meteor';
import { MongoInternals } from 'meteor/mongo';

import { Livechat } from '../../../../../app/livechat/server';
import { forwardRoomToAgent } from '../../../../../app/livechat/server/lib/Helper';
import { RoutingManager } from '../../../../../app/livechat/server/lib/RoutingManager';
import { settings } from '../../../../../app/settings/server';
import { schedulerLogger } from './logger';

const SCHEDULER_NAME = 'omnichannel_scheduler';

class AutoTransferChatSchedulerClass {
	scheduler: Agenda;

	running: boolean;

	user: IUser;

	logger: MainLogger;

	constructor() {
		this.logger = schedulerLogger.section('AutoTransferChatScheduler');
	}

	public async init(): Promise<void> {
		if (this.running) {
			this.logger.debug('Already running');
			return;
		}

		this.scheduler = new Agenda({
			mongo: (MongoInternals.defaultRemoteCollectionDriver().mongo as any).client.db(),
			db: { collection: SCHEDULER_NAME },
			defaultConcurrency: 1,
		});

		await this.scheduler.start();
		this.running = true;
		this.logger.debug('Started');
	}

	private async getSchedulerUser(): Promise<IUser | null> {
		return Users.findOneById('rocket.cat');
	}

	public async scheduleRoom(roomId: string, timeout: number): Promise<void> {
		this.logger.debug(`Scheduling room ${roomId} to be transferred in ${timeout} seconds`);
		await this.unscheduleRoom(roomId);

		const jobName = `${SCHEDULER_NAME}-${roomId}`;
		const when = new Date();
		when.setSeconds(when.getSeconds() + timeout);

		this.scheduler.define(jobName, this.executeJob.bind(this));
		await this.scheduler.schedule(when, jobName, { roomId });
		await LivechatRooms.setAutoTransferOngoingById(roomId);
		this.logger.debug(`Scheduled room ${roomId} to be transferred in ${timeout} seconds`);
	}

	public async unscheduleRoom(roomId: string): Promise<void> {
		this.logger.debug(`Unscheduling room ${roomId}`);
		const jobName = `${SCHEDULER_NAME}-${roomId}`;

		await LivechatRooms.unsetAutoTransferOngoingById(roomId);
		await this.scheduler.cancel({ name: jobName });
	}

	private async transferRoom(roomId: string): Promise<void> {
		this.logger.debug(`Transferring room ${roomId}`);
		const room = await LivechatRooms.findOneById(roomId, {
			_id: 1,
			v: 1,
			servedBy: 1,
			open: 1,
			departmentId: 1,
		});
		if (!room?.open || !room?.servedBy?._id) {
			throw new Error('Room is not open or is not being served by an agent');
		}

		const {
			departmentId,
			servedBy: { _id: ignoreAgentId },
		} = room;

		const timeoutDuration = settings.get<number>('Livechat_auto_transfer_chat_timeout').toString();

		if (!RoutingManager.getConfig()?.autoAssignAgent) {
			this.logger.debug(`Auto-assign agent is disabled, returning room ${roomId} as inquiry`);

			await Livechat.returnRoomAsInquiry(room._id, departmentId, {
				scope: 'autoTransferUnansweredChatsToQueue',
				comment: timeoutDuration,
				transferredBy: await this.getSchedulerUser(),
			});
			return;
		}

		const agent = await RoutingManager.getNextAgent(departmentId, ignoreAgentId);
		if (!agent) {
			this.logger.error(`No agent found to transfer room ${room._id} which hasn't been answered in ${timeoutDuration} seconds`);
			return;
		}

		this.logger.debug(`Transferring room ${roomId} to agent ${agent.agentId}`);

		await forwardRoomToAgent(room, {
			userId: agent.agentId,
			transferredBy: await this.getSchedulerUser(),
			transferredTo: agent,
			scope: 'autoTransferUnansweredChatsToAgent',
			comment: timeoutDuration,
		});
	}

	private async executeJob({ attrs: { data } }: any = {}): Promise<void> {
		const { roomId } = data;

		try {
			await this.transferRoom(roomId);

			await Promise.all([LivechatRooms.setAutoTransferredAtById(roomId), this.unscheduleRoom(roomId)]);
		} catch (error) {
			this.logger.error(`Error while executing job ${SCHEDULER_NAME} for room ${roomId}:`, error);
		}
	}
}

export const AutoTransferChatScheduler = new AutoTransferChatSchedulerClass();

Meteor.startup(() => {
	void AutoTransferChatScheduler.init();
});
