import { Agenda } from '@rocket.chat/agenda';
import { MongoInternals } from 'meteor/mongo';
import { Meteor } from 'meteor/meteor';
import { LivechatRooms } from '@rocket.chat/models';
import type { IUser } from '@rocket.chat/core-typings';

import { Users } from '../../../../../app/models/server';
import { Livechat } from '../../../../../app/livechat/server';
import { RoutingManager } from '../../../../../app/livechat/server/lib/RoutingManager';
import { forwardRoomToAgent } from '../../../../../app/livechat/server/lib/Helper';
import { settings } from '../../../../../app/settings/server';
import { logger } from './logger';

const schedulerUser = Users.findOneById('rocket.cat');
const SCHEDULER_NAME = 'omnichannel_scheduler';

class AutoTransferChatSchedulerClass {
	scheduler: Agenda;

	running: boolean;

	user: IUser;

	public async init(): Promise<void> {
		if (this.running) {
			return;
		}

		this.scheduler = new Agenda({
			mongo: (MongoInternals.defaultRemoteCollectionDriver().mongo as any).client.db(),
			db: { collection: SCHEDULER_NAME },
			defaultConcurrency: 1,
		});

		await this.scheduler.start();
		this.running = true;
	}

	public async scheduleRoom(roomId: string, timeout: number): Promise<void> {
		await this.unscheduleRoom(roomId);

		const jobName = `${SCHEDULER_NAME}-${roomId}`;
		const when = new Date();
		when.setSeconds(when.getSeconds() + timeout);

		this.scheduler.define(jobName, this.executeJob.bind(this));
		await this.scheduler.schedule(when, jobName, { roomId });
		await LivechatRooms.setAutoTransferOngoingById(roomId);
	}

	public async unscheduleRoom(roomId: string): Promise<void> {
		const jobName = `${SCHEDULER_NAME}-${roomId}`;

		await LivechatRooms.unsetAutoTransferOngoingById(roomId);
		await this.scheduler.cancel({ name: jobName });
	}

	private async transferRoom(roomId: string): Promise<void> {
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

		if (!RoutingManager.getConfig().autoAssignAgent) {
			Livechat.returnRoomAsInquiry(room._id, departmentId, {
				scope: 'autoTransferUnansweredChatsToQueue',
				comment: timeoutDuration,
				transferredBy: schedulerUser,
			});
			return;
		}

		const agent = await RoutingManager.getNextAgent(departmentId, ignoreAgentId);
		if (!agent) {
			logger.error(`No agent found to transfer room ${room._id} which hasn't been answered in ${timeoutDuration} seconds`);
		}

		await forwardRoomToAgent(room, {
			userId: agent.agentId,
			transferredBy: schedulerUser,
			transferredTo: agent,
			scope: 'autoTransferUnansweredChatsToAgent',
			comment: timeoutDuration,
		});
	}

	private async executeJob({ attrs: { data } }: any = {}): Promise<void> {
		const { roomId } = data;

		try {
			await this.transferRoom(roomId);
			await LivechatRooms.setAutoTransferredAtById(roomId);
		} catch (error) {
			logger.error(`Error while executing job ${SCHEDULER_NAME} for room ${roomId}:`, error);
		} finally {
			await this.unscheduleRoom(roomId);
		}
	}
}

export const AutoTransferChatScheduler = new AutoTransferChatSchedulerClass();

Meteor.startup(() => {
	void AutoTransferChatScheduler.init();
});
