import type { IUser, IOmnichannelRoom } from '@rocket.chat/core-typings';
import { cronJobs } from '@rocket.chat/cron';
import type { MainLogger } from '@rocket.chat/logger';
import { LivechatRooms, LivechatInquiry as LivechatInquiryRaw, Users } from '@rocket.chat/models';

import { schedulerLogger } from './logger';
import { closeRoom } from '../../../../../app/livechat/server/lib/closeRoom';
import { settings } from '../../../../../app/settings/server';
import { i18n } from '../../../../../server/lib/i18n';

export class OmnichannelQueueInactivityMonitorClass {
	logger: MainLogger;

	_name: string;

	message: string;

	constructor() {
		this._name = 'Omnichannel-Queue-Inactivity-Monitor';
		this.logger = schedulerLogger.section(this._name);
		const language = settings.get<string>('Language') || 'en';
		this.message = i18n.t('Closed_automatically_chat_queued_too_long', { lng: language });
	}

	private async getRocketCatUser(): Promise<IUser | null> {
		return Users.findOneById('rocket.cat', { projection: { __rooms: 0 } });
	}

	getName(inquiryId: string): string {
		return `${this._name}-${inquiryId}`;
	}

	async scheduleInquiry(inquiryId: string, time: Date): Promise<void> {
		await this.stopInquiry(inquiryId);
		this.logger.debug({ msg: 'Scheduling automatic close of inquiry', inquiryId, scheduledAt: time });
		await cronJobs.addAtTimestamp(this.getName(inquiryId), time, () => this.closeRoom(inquiryId));
	}

	async stop(): Promise<void> {
		await cronJobs.removeByNamePrefix(`${this._name}-`);
	}

	async stopInquiry(inquiryId: string): Promise<void> {
		await cronJobs.remove(this.getName(inquiryId));
	}

	async closeRoomAction(room: IOmnichannelRoom): Promise<void> {
		const comment = this.message;
		return closeRoom({
			comment,
			room,
			user: await this.getRocketCatUser(),
		});
	}

	async closeRoom(inquiryId: string): Promise<void> {
		try {
			const inquiry = await LivechatInquiryRaw.findOneById(inquiryId, { projection: { status: 1, rid: 1 } });
			if (inquiry?.status !== 'queued') {
				return;
			}

			const room = await LivechatRooms.findOneById(inquiry.rid);
			if (!room) {
				this.logger.error({ msg: 'Unable to find room to close in queue inactivity monitor', inquiryId, roomId: inquiry.rid });
				return;
			}

			await this.closeRoomAction(room);
			this.logger.info({ msg: 'Closed room due to queue inactivity', roomId: inquiry.rid, inquiryId });
		} finally {
			await this.stopInquiry(inquiryId);
		}
	}
}

export const OmnichannelQueueInactivityMonitor = new OmnichannelQueueInactivityMonitorClass();
