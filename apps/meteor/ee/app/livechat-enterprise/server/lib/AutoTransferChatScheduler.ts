import { Agenda } from '@rocket.chat/agenda';
import type { IUser } from '@rocket.chat/core-typings';
import type { MainLogger } from '@rocket.chat/logger';
import { LivechatRooms, Users } from '@rocket.chat/models';
import { Meteor } from 'meteor/meteor';
import { MongoInternals } from 'meteor/mongo';

import { schedulerLogger } from './logger';
import { forwardRoomToAgent } from '../../../../../app/livechat/server/lib/Helper';
import { RoutingManager } from '../../../../../app/livechat/server/lib/RoutingManager';
import { returnRoomAsInquiry } from '../../../../../app/livechat/server/lib/rooms';
import { settings } from '../../../../../app/settings/server';

const SCHEDULER_NAME = 'omnichannel_scheduler';

export class AutoTransferChatSchedulerClass {
	scheduler: Agenda;

	running: boolean;

	user: IUser;

	logger: MainLogger;

	constructor() {
		this.logger = schedulerLogger.section('AutoTransferChatScheduler');
	}

	public async init(): Promise<void> {
		if (this.running) {
			return;
		}

		this.scheduler = new Agenda({
			mongo: (MongoInternals.defaultRemoteCollectionDriver().mongo as any).client.db(),
			db: { collection: SCHEDULER_NAME },
			defaultConcurrency: 1,
			processEvery: process.env.TEST_MODE === 'true' ? '3 seconds' : '1 minute',
		});

		await this.scheduler.start();
		this.running = true;
		this.logger.info('Service started');
	}

	private async getSchedulerUser(): Promise<IUser & { userType: 'user' }> {
		const user = await Users.findOneById('rocket.cat');
		if (!user) {
			this.logger.error('Error while transferring room: user not found');
			throw new Error('error-no-cat');
		}
		return {
			...user,
			userType: 'user',
		};
	}

	public async scheduleRoom(roomId: string, timeout: number): Promise<void> {
		this.logger.debug({ msg: 'Scheduling room to be transferred', roomId, timeoutSeconds: timeout });
		await this.unscheduleRoom(roomId);

		const jobName = `${SCHEDULER_NAME}-${roomId}`;
		const when = new Date();
		when.setSeconds(when.getSeconds() + timeout);

		this.scheduler.define(jobName, this.executeJob.bind(this));
		await this.scheduler.schedule(when, jobName, { roomId });
		await LivechatRooms.setAutoTransferOngoingById(roomId);
	}

	public async unscheduleRoom(roomId: string): Promise<void> {
		this.logger.debug({ msg: 'Unscheduling room', roomId });
		const jobName = `${SCHEDULER_NAME}-${roomId}`;

		await LivechatRooms.unsetAutoTransferOngoingById(roomId);
		await this.scheduler.cancel({ name: jobName });
	}

	private async transferRoom(roomId: string): Promise<void> {
		this.logger.debug({ msg: 'Transferring room', roomId });
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
			this.logger.debug({ msg: 'Auto-assign agent is disabled, returning room as inquiry', roomId });

			await returnRoomAsInquiry(room, departmentId, {
				scope: 'autoTransferUnansweredChatsToQueue',
				comment: timeoutDuration,
				transferredBy: await this.getSchedulerUser(),
			});
			return;
		}

		const agent = await RoutingManager.getNextAgent(departmentId, ignoreAgentId);
		if (!agent) {
			this.logger.error({
				msg: 'No agent found to transfer unanswered room',
				roomId: room._id,
				timeoutSeconds: timeoutDuration,
			});
			return;
		}

		this.logger.debug({ msg: 'Transferring room to agent', roomId, agentId: agent.agentId });

		const transferredBy = await this.getSchedulerUser();

		await forwardRoomToAgent(room, {
			userId: agent.agentId,
			transferredBy,
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
			this.logger.error({ msg: 'Error while executing auto-transfer job', schedulerName: SCHEDULER_NAME, roomId, err: error });
		}
	}
}

export const AutoTransferChatScheduler = new AutoTransferChatSchedulerClass();

Meteor.startup(() => {
	void AutoTransferChatScheduler.init();
});
