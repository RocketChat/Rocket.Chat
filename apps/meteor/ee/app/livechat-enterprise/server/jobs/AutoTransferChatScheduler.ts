import { IOmnichannelRoom, IUser } from '@rocket.chat/core-typings';
import { LivechatRooms, Users } from '@rocket.chat/models';
import { Db } from 'mongodb';
import { Meteor } from 'meteor/meteor';

import { Livechat } from '../../../../../app/livechat/server';
import { forwardRoomToAgent } from '../../../../../app/livechat/server/lib/Helper';
import { RoutingManager } from '../../../../../app/livechat/server/lib/RoutingManager';
import { schedulerLogger } from '../lib/logger';
import { AbstractOmniSchedulerClass } from './AbstractOmniSchedulerClass';

const AUTO_TRANSFER_UNANSWERED_CHAT_JOB_NAME = 'omnichannel_auto_transfer_unanswered_chat';

type JobData = {
	roomId: string;
};

// singleton class
export class AutoTransferChatScheduler extends AbstractOmniSchedulerClass {
	private static instance: AutoTransferChatScheduler;

	schedulerUser: IUser;

	initialize(): void {
		this.scheduler.define(AUTO_TRANSFER_UNANSWERED_CHAT_JOB_NAME, this.executeJob.bind(this));
	}

	createIndexes(db: Db): void {
		db.createIndex(
			'data_RoomId_1',
			{
				'data.roomId': 1,
			},
			{ unique: true },
		);
	}

	public static getInstance(): AutoTransferChatScheduler {
		if (!AutoTransferChatScheduler.instance) {
			AutoTransferChatScheduler.instance = new AutoTransferChatScheduler();
		}

		return AutoTransferChatScheduler.instance;
	}

	public static initializeScheduler(): void {
		AutoTransferChatScheduler.getInstance();
	}

	async getSchedularUser(): Promise<IUser> {
		if (this.schedulerUser) {
			return this.schedulerUser;
		}
		const user = await Users.findOneById('rocket.cat');
		if (!user) {
			throw new Error(`Could not find scheduler user with id 'rocket.cat'`);
		}
		this.schedulerUser = user;
		return this.schedulerUser;
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
		const room = await LivechatRooms.findOneById<IOmnichannelRoom>(roomId, {
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
				transferredBy: await this.getSchedularUser(),
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

Meteor.startup(() => {
	AutoTransferChatScheduler.initializeScheduler();
});
