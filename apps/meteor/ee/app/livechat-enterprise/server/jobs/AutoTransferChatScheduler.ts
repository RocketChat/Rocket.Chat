import type { IOmnichannelRoom, IRoom, IUser } from '@rocket.chat/core-typings';
import { LivechatRooms, Users } from '@rocket.chat/models';
import type { Collection } from 'mongodb';
import moment from 'moment';
import type { Job } from '@rocket.chat/agenda';

import { Livechat } from '../../../../../app/livechat/server';
import { forwardRoomToAgent } from '../../../../../app/livechat/server/lib/Helper';
import { RoutingManager } from '../../../../../app/livechat/server/lib/RoutingManager';
import { schedulerLogger } from '../lib/logger';
import { AbstractOmniSchedulerClass } from './AbstractOmniSchedulerClass';

const JOB_NAME = 'omnichannel_auto_transfer_unanswered_chat';

type JobData = {
	roomId: IRoom['_id'];
};

// singleton class
export class AutoTransferChatSchedulerClass extends AbstractOmniSchedulerClass {
	private static instance: AutoTransferChatSchedulerClass;

	schedulerUser: IUser;

	createJobDefinition(): void {
		this.scheduler.define(JOB_NAME, this.executeJob.bind(this));
	}

	createIndexes(collection: Collection): void {
		collection.createIndex(
			{
				'data.roomId': 1,
			},
			{ sparse: true },
		);
	}

	public static getInstance(): AutoTransferChatSchedulerClass {
		if (!AutoTransferChatSchedulerClass.instance) {
			AutoTransferChatSchedulerClass.instance = new AutoTransferChatSchedulerClass();
		}

		return AutoTransferChatSchedulerClass.instance;
	}

	public static initializeScheduler(): void {
		AutoTransferChatSchedulerClass.getInstance();
	}

	// cache for SchedulerUser variable
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
		schedulerLogger.debug(`Scheduling ${JOB_NAME} for room ${roomId}`);
		await this.unscheduleRoom(roomId);

		const when = moment(new Date()).add(timeout, 's').toDate();

		const [job] = await Promise.all([
			this.scheduler.schedule(when, JOB_NAME, { roomId } as JobData),
			LivechatRooms.setAutoTransferOngoingById(roomId),
		]);

		schedulerLogger.debug(`Scheduled ${JOB_NAME} for room ${roomId} at ${job.attrs.nextRunAt}`);
	}

	public async unscheduleRoom(roomId: string): Promise<void> {
		schedulerLogger.debug(`Unscheduling ${JOB_NAME} for room ${roomId}`);

		const [, totalCancelledJobs] = await Promise.all([
			LivechatRooms.unsetAutoTransferOngoingById(roomId),
			this.scheduler.cancel({ data: { roomId } }),
		]);

		schedulerLogger.debug(`Unscheduled ${JOB_NAME} for room ${roomId} (${totalCancelledJobs} jobs cancelled)`);
	}

	private async transferRoom(roomId: string): Promise<boolean> {
		const room = await LivechatRooms.findOneById<IOmnichannelRoom>(roomId, {
			projection: {
				_id: 1,
				v: 1,
				servedBy: 1,
				open: 1,
				departmentId: 1,
			},
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

	private async executeJob(job: Job): Promise<void> {
		const data = job.attrs.data as JobData;
		schedulerLogger.debug(`Executing ${JOB_NAME} for room ${data.roomId}`);
		const { roomId } = data;

		if (await this.transferRoom(roomId)) {
			schedulerLogger.debug(`Transferred room ${roomId}`);
			LivechatRooms.setAutoTransferredAtById(roomId);
		}

		await this.unscheduleRoom(roomId);

		schedulerLogger.debug(`Executed ${JOB_NAME} for room ${roomId}`);
	}
}

export const AutoTransferChatScheduler = AutoTransferChatSchedulerClass.getInstance();
