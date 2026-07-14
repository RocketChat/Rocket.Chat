import type { IUser } from '@rocket.chat/core-typings';
import { cronJobs } from '@rocket.chat/cron';
import type { MainLogger } from '@rocket.chat/logger';
import { LivechatRooms, Users } from '@rocket.chat/models';

import { schedulerLogger } from './logger';
import { forwardRoomToAgent } from '../../../../../app/livechat/server/lib/Helper';
import { RoutingManager } from '../../../../../app/livechat/server/lib/RoutingManager';
import { returnRoomAsInquiry } from '../../../../../app/livechat/server/lib/rooms';
import { settings } from '../../../../../app/settings/server';

const SCHEDULER_NAME = 'omnichannel_auto_transfer_scheduler';

export class AutoTransferChatSchedulerClass {
	logger: MainLogger;

	constructor() {
		this.logger = schedulerLogger.section('AutoTransferChatScheduler');
	}

	private async getSchedulerUser(): Promise<IUser & { userType: 'user' }> {
		const user = await Users.findOneById('rocket.cat', { projection: { __rooms: 0 } });
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

		const when = new Date(Date.now() + timeout * 1000);
		await cronJobs.addAtTimestamp(`${SCHEDULER_NAME}-${roomId}`, when, () => this.executeJob(roomId));
		await LivechatRooms.setAutoTransferOngoingById(roomId);
	}

	public async unscheduleRoom(roomId: string): Promise<void> {
		this.logger.debug({ msg: 'Unscheduling room', roomId });

		await LivechatRooms.unsetAutoTransferOngoingById(roomId);
		await cronJobs.remove(`${SCHEDULER_NAME}-${roomId}`);
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
		if (!room) {
			throw new Error('error-room-not-found');
		}
		if (!room.open) {
			throw new Error('error-room-already-closed');
		}
		if (!room.servedBy?._id) {
			throw new Error('error-room-not-served');
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

	private async executeJob(roomId: string): Promise<void> {
		try {
			await this.transferRoom(roomId);
			await LivechatRooms.setAutoTransferredAtById(roomId);
		} catch (error) {
			this.logger.error({ msg: 'Error while executing auto-transfer job', schedulerName: SCHEDULER_NAME, roomId, err: error });
		} finally {
			await this.unscheduleRoom(roomId);
		}
	}
}

export const AutoTransferChatScheduler = new AutoTransferChatSchedulerClass();
