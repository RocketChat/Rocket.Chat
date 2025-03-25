import { Agenda } from '@rocket.chat/agenda';
import type { IUser, IOmnichannelRoom } from '@rocket.chat/core-typings';
import type { MainLogger } from '@rocket.chat/logger';
import { LivechatRooms, LivechatInquiry as LivechatInquiryRaw, Users } from '@rocket.chat/models';
import { Meteor } from 'meteor/meteor';
import { MongoInternals } from 'meteor/mongo';
import type { Db } from 'mongodb';

import { schedulerLogger } from './logger';
import { closeRoom } from '../../../../../app/livechat/server/lib/closeRoom';
import { settings } from '../../../../../app/settings/server';
import { i18n } from '../../../../../server/lib/i18n';

const SCHEDULER_NAME = 'omnichannel_queue_inactivity_monitor';

export class OmnichannelQueueInactivityMonitorClass {
	scheduler: Agenda;

	running: boolean;

	logger: MainLogger;

	_name: string;

	user: IUser;

	message: string;

	_db: Db;

	bindedCloseRoom: any;

	constructor() {
		this._db = MongoInternals.defaultRemoteCollectionDriver().mongo.db;
		this.running = false;
		this._name = 'Omnichannel-Queue-Inactivity-Monitor';
		this.logger = schedulerLogger.section(this._name);
		this.scheduler = new Agenda({
			mongo: (MongoInternals.defaultRemoteCollectionDriver().mongo as any).client.db(),
			db: { collection: SCHEDULER_NAME },
			defaultConcurrency: 1,
			processEvery: process.env.TEST_MODE === 'true' ? '3 seconds' : '1 minute',
		});
		this.createIndex();
		const language = settings.get<string>('Language') || 'en';
		this.message = i18n.t('Closed_automatically_chat_queued_too_long', { lng: language });
		this.bindedCloseRoom = this.closeRoom.bind(this);
	}

	private async getRocketCatUser(): Promise<IUser | null> {
		return Users.findOneById('rocket.cat');
	}

	getName(inquiryId: string): string {
		return `${this._name}-${inquiryId}`;
	}

	createIndex(): void {
		void this._db.collection(SCHEDULER_NAME).createIndex(
			{
				'data.inquiryId': 1,
			},
			{ unique: true },
		);
	}

	async start(): Promise<void> {
		if (this.running) {
			return;
		}

		await this.scheduler.start();
		this.logger.info('Service started');
		this.running = true;
	}

	async scheduleInquiry(inquiryId: string, time: Date): Promise<void> {
		await this.stopInquiry(inquiryId);
		this.logger.debug(`Scheduling automatic close of inquiry ${inquiryId} at ${time}`);
		const name = this.getName(inquiryId);
		this.scheduler.define(name, this.bindedCloseRoom);

		const job = this.scheduler.create(name, { inquiryId });
		job.schedule(time);
		job.unique({ 'data.inquiryId': inquiryId });
		await job.save();
	}

	async stop(): Promise<void> {
		if (!this.running) {
			return;
		}
		await this.scheduler.cancel({});
		this.running = false;
	}

	async stopInquiry(inquiryId: string): Promise<void> {
		const name = this.getName(inquiryId);
		await this.scheduler.cancel({ name });
	}

	async closeRoomAction(room: IOmnichannelRoom): Promise<void> {
		const comment = this.message;
		return closeRoom({
			comment,
			room,
			user: await this.getRocketCatUser(),
		});
	}

	async closeRoom({ attrs: { data } }: any = {}): Promise<void> {
		const { inquiryId } = data;
		// TODO: add projection and maybe use findOneQueued to avoid fetching the whole inquiry
		const inquiry = await LivechatInquiryRaw.findOneById(inquiryId);
		if (!inquiry || inquiry.status !== 'queued') {
			return;
		}

		const room = await LivechatRooms.findOneById(inquiry.rid);
		if (!room) {
			this.logger.error(`Unable to find room ${inquiry.rid} for inquiry ${inquiryId} to close in queue inactivity monitor`);
			return;
		}

		await Promise.all([this.closeRoomAction(room), this.stopInquiry(inquiryId)]);
		this.logger.info(`Closed room ${inquiry.rid} for inquiry ${inquiryId} due to inactivity`);
	}
}

export const OmnichannelQueueInactivityMonitor = new OmnichannelQueueInactivityMonitorClass();

Meteor.startup(async () => {
	void OmnichannelQueueInactivityMonitor.start();
});
