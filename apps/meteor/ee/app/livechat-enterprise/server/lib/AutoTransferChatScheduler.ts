import { Agenda } from '@rocket.chat/agenda';
import { MongoInternals } from 'meteor/mongo';
import { Meteor } from 'meteor/meteor';
import type { IUser } from '@rocket.chat/core-typings';

import { LivechatRooms, Users } from '../../../../../app/models/server';
import { Livechat } from '../../../../../app/livechat/server';
import { RoutingManager } from '../../../../../app/livechat/server/lib/RoutingManager';
import { forwardRoomToAgent } from '../../../../../app/livechat/server/lib/Helper';
import { schedulerLogger } from './logger';

const schedulerUser = Users.findOneById('rocket.cat');
const SCHEDULER_NAME = 'omnichannel_scheduler';
const AUTO_TRANSFER_UNANSWERED_CHAT_JOB_NAME = 'omnichannel_auto_transfer_unanswered_chat';

type JobData = {
	roomId: string;
};

class AutoTransferChatSchedulerClass {
	scheduler: Agenda;

	running: boolean;

	user: IUser;

	public init(): void {
		if (this.running) {
			return;
		}

		this.scheduler = new Agenda({
			mongo: (MongoInternals.defaultRemoteCollectionDriver().mongo as any).client.db(),
			db: { collection: SCHEDULER_NAME },
			defaultLockLifetime: 1000, // 1 minute
			defaultConcurrency: 1,
		});

		this.scheduler.on('ready', async () =>
			this.scheduler.start().then(() => {
				this.running = true;
				schedulerLogger.info(`${SCHEDULER_NAME} started`);
			}),
		);

		process.on('SIGINT', () => {
			schedulerLogger.info(`SIGINT received. Stopping ${SCHEDULER_NAME}...`);
			this.scheduler.stop();
		});
		process.on('SIGTERM', () => {
			schedulerLogger.info(`SIGTERM received. Stopping ${SCHEDULER_NAME}...`);
			this.scheduler.stop();
		});

		this.scheduler.define<JobData>(AUTO_TRANSFER_UNANSWERED_CHAT_JOB_NAME, this.executeJob.bind(this));
	}

	public async scheduleRoom(roomId: string, timeout: number): Promise<void> {
		schedulerLogger.debug(`Scheduling ${AUTO_TRANSFER_UNANSWERED_CHAT_JOB_NAME} for room ${roomId}`);
		await this.unscheduleRoom(roomId);

		const [job] = await Promise.all([
			this.scheduler.schedule<JobData>(this.addSecondsToDate(new Date(), timeout), AUTO_TRANSFER_UNANSWERED_CHAT_JOB_NAME, { roomId }),
			LivechatRooms.setAutoTransferOngoingById(roomId),
		]);

		schedulerLogger.debug(`Scheduled ${AUTO_TRANSFER_UNANSWERED_CHAT_JOB_NAME} for room ${roomId} at ${job.attrs.nextRunAt}`);
	}

	public async unscheduleRoom(roomId: string): Promise<void> {
		schedulerLogger.debug(`Unscheduling ${AUTO_TRANSFER_UNANSWERED_CHAT_JOB_NAME} for room ${roomId}`);

		const [, totalCancelledJobs] = await Promise.all([
			LivechatRooms.unsetAutoTransferOngoingById(roomId),
			this.scheduler.cancel({ data: { roomId } }),
		]);

		schedulerLogger.debug(
			`Unscheduled ${AUTO_TRANSFER_UNANSWERED_CHAT_JOB_NAME} for room ${roomId} (${totalCancelledJobs} jobs cancelled)`,
		);
	}

	private async transferRoom(roomId: string): Promise<boolean> {
		const room = LivechatRooms.findOneById(roomId, {
			_id: 1,
			v: 1,
			servedBy: 1,
			open: 1,
			departmentId: 1,
		});
		if (!room?.open || !room?.servedBy?._id) {
			return false;
		}

		const {
			departmentId,
			servedBy: { _id: ignoreAgentId },
		} = room;

		if (!RoutingManager.getConfig().autoAssignAgent) {
			return Livechat.returnRoomAsInquiry(room._id, departmentId);
		}

		const agent = await RoutingManager.getNextAgent(departmentId, ignoreAgentId);
		if (agent) {
			return forwardRoomToAgent(room, {
				userId: agent.agentId,
				transferredBy: schedulerUser,
				transferredTo: agent,
			});
		}

		return false;
	}

	private async executeJob({ attrs: { data } }: any = {}): Promise<void> {
		schedulerLogger.debug(`Executing ${AUTO_TRANSFER_UNANSWERED_CHAT_JOB_NAME} for room ${data.roomId}`);
		const { roomId } = data;

		if (await this.transferRoom(roomId)) {
			schedulerLogger.debug(`Transferred room ${roomId}`);
			LivechatRooms.setAutoTransferredAtById(roomId);
		}

		await this.unscheduleRoom(roomId);

		schedulerLogger.debug(`Executed ${AUTO_TRANSFER_UNANSWERED_CHAT_JOB_NAME} for room ${roomId}`);
	}

	private addSecondsToDate = (date: Date, seconds: number): Date => {
		return new Date(date.getTime() + seconds * 1000);
	};
}

export const AutoTransferChatScheduler = new AutoTransferChatSchedulerClass();

Meteor.startup(() => {
	AutoTransferChatScheduler.init();
});
