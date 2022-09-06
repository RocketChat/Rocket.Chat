import type { Job } from '@rocket.chat/agenda';
import type { IOmnichannelRoom, IRoom, IUser } from '@rocket.chat/core-typings';
import { LivechatRooms, Users } from '@rocket.chat/models';
import moment from 'moment';
import { TAPi18n } from 'meteor/rocketchat:tap-i18n';

import { Livechat } from '../../../../app/livechat/server';
import { forwardRoomToAgent } from '../../../../app/livechat/server/lib/Helper';
import { RoutingManager } from '../../../../app/livechat/server/lib/RoutingManager';
import { settings } from '../../../../app/settings/server';
import { ServiceClassInternal } from '../../../../server/sdk/types/ServiceClass';
import { schedulerLogger } from '../../../app/livechat-enterprise/server/lib/logger';
import { OmniJobSchedulerService } from '../../sdk';
import type { IOmniEEService } from '../../sdk/types/IOmniEEService';
import { OMNI_JOB_NAME } from './OmniJobSchedulerService';

type OmniOnHoldJobData = {
	roomId: IRoom['_id'];
	comment: string;
};

type OmniAutoTransferUnansweredChatJobData = {
	roomId: IRoom['_id'];
};

export class OmniEEService extends ServiceClassInternal implements IOmniEEService {
	protected name = 'omni-ee-service';

	private logger = schedulerLogger;

	private systemUser: IUser;

	constructor() {
		super();
		this.logger.debug('OmniEEService started');
	}

	async monitorOnHoldRoomForAutoClose(roomId: string, timeout: number, comment: string): Promise<void> {
		this.logger.debug(`monitorOnHoldRoomForAutoClose: ${roomId}`);
		await this.cancelMonitorOnHoldRoomForAutoClose(roomId);

		const when = moment(new Date()).add(timeout, 's').toDate();
		const job = await OmniJobSchedulerService.scheduleJobAt<OmniOnHoldJobData>(OMNI_JOB_NAME.AUTO_CLOSE_ON_HOLD_CHAT, when, {
			roomId,
			comment,
		});

		this.logger.debug(`Scheduled job: ${OMNI_JOB_NAME.AUTO_CLOSE_ON_HOLD_CHAT} for room ${roomId} at ${job.attrs.nextRunAt}`);
	}

	async cancelMonitorOnHoldRoomForAutoClose(roomId: string): Promise<void> {
		this.logger.debug(`cancelMonitorOnHoldRoomForAutoClose: ${roomId}`);

		const totalCancelledJobs = await OmniJobSchedulerService.cancelJobByRoomId(OMNI_JOB_NAME.AUTO_CLOSE_ON_HOLD_CHAT, roomId);

		this.logger.debug(`Unscheduled ${OMNI_JOB_NAME.AUTO_CLOSE_ON_HOLD_CHAT} for room ${roomId} (${totalCancelledJobs} jobs cancelled)`);
	}

	async autoCloseOnHoldChat(job: Job): Promise<void> {
		const data = job.attrs.data as OmniOnHoldJobData;

		this.logger.debug(`Executing job: ${OMNI_JOB_NAME.AUTO_CLOSE_ON_HOLD_CHAT} for room ${data.roomId}`);

		const { roomId, comment } = data;
		const [room, user] = await Promise.all([LivechatRooms.findOneById(roomId), this.getSystemUser()]);
		if (!room) {
			this.logger.error(`Could not find room ${roomId}`);
		}
		const payload = {
			user,
			room,
			comment,
			options: {},
			visitor: undefined,
		};
		Livechat.closeRoom(payload);

		this.logger.debug(`Executed ${OMNI_JOB_NAME.AUTO_CLOSE_ON_HOLD_CHAT} for room ${roomId}`);
	}

	async monitorUnansweredRoomForAutoTransfer(roomId: string, timeout: number): Promise<void> {
		this.logger.debug(`monitorUnansweredRoomForAutoTransfer: ${roomId}`);
		await this.cancelMonitorUnansweredRoomForAutoTransfer(roomId);

		const when = moment(new Date()).add(timeout, 's').toDate();

		const [job] = await Promise.all([
			OmniJobSchedulerService.scheduleJobAt<OmniAutoTransferUnansweredChatJobData>(OMNI_JOB_NAME.AUTO_TRANSFER_UNANSWERED_CHAT, when, {
				roomId,
			} as OmniAutoTransferUnansweredChatJobData),
			LivechatRooms.setAutoTransferOngoingById(roomId),
		]);

		this.logger.debug(`Scheduled job: ${OMNI_JOB_NAME.AUTO_TRANSFER_UNANSWERED_CHAT} for room ${roomId} at ${job.attrs.nextRunAt}`);
	}

	async cancelMonitorUnansweredRoomForAutoTransfer(roomId: string): Promise<void> {
		this.logger.debug(`cancelMonitorUnansweredRoomForAutoTransfer: ${roomId}`);

		const [, totalCancelledJobs] = await Promise.all([
			LivechatRooms.unsetAutoTransferOngoingById(roomId),
			OmniJobSchedulerService.cancelJobByRoomId(OMNI_JOB_NAME.AUTO_TRANSFER_UNANSWERED_CHAT, roomId),
		]);

		this.logger.debug(
			`Unscheduled ${OMNI_JOB_NAME.AUTO_TRANSFER_UNANSWERED_CHAT} for room ${roomId} (${totalCancelledJobs} jobs cancelled)`,
		);
	}

	async autoTransferUnansweredChat(job: Job): Promise<void> {
		const data = job.attrs.data as OmniAutoTransferUnansweredChatJobData;
		this.logger.debug(`Executing ${OMNI_JOB_NAME.AUTO_TRANSFER_UNANSWERED_CHAT} for room ${data.roomId}`);
		const { roomId } = data;

		if (await this.transferRoom(roomId)) {
			this.logger.debug(`Transferred room ${roomId}`);
			LivechatRooms.setAutoTransferredAtById(roomId);
		}

		await this.cancelMonitorUnansweredRoomForAutoTransfer(roomId);

		this.logger.debug(`Executed ${OMNI_JOB_NAME.AUTO_TRANSFER_UNANSWERED_CHAT} for room ${roomId}`);
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

		const comment = TAPi18n.__('Livechat_auto_transfer_unanswered_chats_comment', {
			duration: settings.get('Livechat_auto_transfer_chat_timeout'),
		});
		if (!RoutingManager.getConfig().autoAssignAgent) {
			return Livechat.returnRoomAsInquiry(room._id, departmentId, comment);
		}

		const agent = await RoutingManager.getNextAgent(departmentId, ignoreAgentId);
		if (agent) {
			return forwardRoomToAgent(room, {
				userId: agent.agentId,
				transferredBy: await this.getSystemUser(),
				transferredTo: agent,
				comment,
			});
		}

		return false;
	}

	private async getSystemUser(): Promise<IUser> {
		if (this.systemUser) {
			return this.systemUser;
		}
		const user = await Users.findOneById('rocket.cat');
		if (!user) {
			throw new Error(`Could not find scheduler user with id 'rocket.cat'`);
		}
		this.systemUser = user;
		return this.systemUser;
	}
}
