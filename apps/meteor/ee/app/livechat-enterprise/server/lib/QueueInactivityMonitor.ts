import { Db } from 'mongodb';
import Agenda from 'agenda';
import { MongoInternals } from 'meteor/mongo';
import { Meteor } from 'meteor/meteor';
import { TAPi18n } from 'meteor/rocketchat:tap-i18n';
import type { IUser, IOmnichannelRoom } from '@rocket.chat/core-typings';

import { settings } from '../../../../../app/settings/server';
import { Logger } from '../../../../../app/logger/server';
import { LivechatRooms, Users, LivechatInquiry } from '../../../../../app/models/server';
import { Livechat } from '../../../../../app/livechat/server/lib/Livechat';

const SCHEDULER_NAME = 'omnichannel_queue_inactivity_monitor';

export class OmnichannelQueueInactivityMonitorClass {
	scheduler: Agenda;

	running: boolean;

	logger: Logger;

	_name: string;

	user: IUser;

	message: string;

	_db: Db;

	bindedCloseRoom: any;

	constructor() {
		this._db = MongoInternals.defaultRemoteCollectionDriver().mongo.db;
		this.running = false;
		this._name = 'Omnichannel-Queue-Inactivity-Monitor';
		this.logger = new Logger('QueueInactivityMonitor');
		this.scheduler = new Agenda({
			mongo: (MongoInternals.defaultRemoteCollectionDriver().mongo as any).client.db(),
			db: { collection: SCHEDULER_NAME },
			defaultConcurrency: 1,
		});
		this.createIndex();
		this.user = Users.findOneById('rocket.cat');
		const language = settings.get<string>('Language') || 'en';
		this.message = TAPi18n.__('Closed_automatically_chat_queued_too_long', { lng: language });
		this.bindedCloseRoom = Meteor.bindEnvironment(this.closeRoom.bind(this));
	}

	getName(inquiryId: string): string {
		return `${this._name}-${inquiryId}`;
	}

	createIndex(): void {
		this._db.collection(SCHEDULER_NAME).createIndex(
			{
				'data.inquiryId': 1,
			},
			{ unique: true },
		);
	}

	start(): void {
		if (this.running) {
			return;
		}

		Promise.await(this.scheduler.start());
		this.running = true;
	}

	scheduleInquiry(inquiryId: string, time: Date): void {
		Promise.await(this.stopInquiry(inquiryId));
		this.logger.debug(`Scheduling automatic close of inquiry ${inquiryId} at ${time}`);
		const name = this.getName(inquiryId);
		this.scheduler.define(name, this.bindedCloseRoom);

		const job = this.scheduler.create(name, { inquiryId });
		job.schedule(time);
		job.unique({ 'data.inquiryId': inquiryId });
		Promise.await(job.save());
	}

	async stop(): Promise<void> {
		if (!this.running) {
			return;
		}
		await this.scheduler.cancel({});
	}

	async stopInquiry(inquiryId: string): Promise<void> {
		const name = this.getName(inquiryId);
		await this.scheduler.cancel({ name });
	}

	closeRoomAction(room: IOmnichannelRoom): void {
		const comment = this.message;
		Livechat.closeRoom({
			comment,
			room,
			user: this.user,
			visitor: null,
		});
	}

	closeRoom({ attrs: { data } }: any = {}): void {
		const { inquiryId } = data;
		const inquiry = LivechatInquiry.findOneById(inquiryId);

		this.logger.debug(`Processing inquiry item ${inquiryId}`);
		if (!inquiry || inquiry.status !== 'queued') {
			this.logger.debug(`Skipping inquiry ${inquiryId}. Invalid or not queued anymore`);
			return;
		}

		this.closeRoomAction(LivechatRooms.findOneById(inquiry.rid));
		Promise.await(this.stopInquiry(inquiryId));
		this.logger.debug(`Running succesful. Closed inquiry ${inquiry._id} because of inactivity`);
	}
}

export const OmnichannelQueueInactivityMonitor = new OmnichannelQueueInactivityMonitorClass();

Meteor.startup(() => {
	OmnichannelQueueInactivityMonitor.start();
});
