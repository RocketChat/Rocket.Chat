import Agenda from 'agenda';
import { MongoInternals } from 'meteor/mongo';
import { Meteor } from 'meteor/meteor';
import { TAPi18n } from 'meteor/rocketchat:tap-i18n';
import moment from 'moment';

import { settings } from '../../../../../app/settings/server';
import { Logger } from '../../../../../app/logger/server';
import { LivechatRooms, Users, LivechatInquiry } from '../../../../../app/models/server';
import { Livechat } from '../../../../../app/livechat/server/lib/Livechat';
import { IUser } from '../../../../../definition/IUser';
import { IOmnichannelRoom } from '../../../../../definition/IRoom';

const SCHEDULER_NAME = 'omnichannel_queue_inactivity_monitor';

export class OmnichannelQueueInactivityMonitorClass {
	scheduler: Agenda;

	running: boolean;

	logger: any;

	_name: string;

	user: IUser;

	message: string;

	constructor() {
		this.running = false;
		this._name = 'Omnichannel-Queue-Inactivity-Monitor';
		this.logger = new Logger('QueueInactivityMonitor');
		this.scheduler = new Agenda({
			mongo: (MongoInternals.defaultRemoteCollectionDriver().mongo as any).client.db(),
			db: { collection: SCHEDULER_NAME },
			defaultConcurrency: 1,
		});
		this.user = Users.findOneById('rocket.cat');
		const language = settings.get('Language') || 'en';
		this.message = TAPi18n.__('Closed_automatically_chat_queued_too_long', { lng: language });
	}

	start(): void {
		if (this.running) {
			return;
		}

		Promise.await(this.scheduler.start());
		this.running = true;
	}

	async stop(): Promise<void> {
		if (!this.running) {
			return;
		}
		await this.scheduler.cancel({ name: this._name });
		this.running = false;
	}

	async schedule(): Promise<void> {
		this.scheduler.define(this._name, Meteor.bindEnvironment(this.job.bind(this)));
		await this.scheduler.every('one minute', this._name);
	}

	closeRooms(room: IOmnichannelRoom): void {
		const comment = this.message;
		Livechat.closeRoom({
			comment,
			room,
			user: this.user,
		});
	}

	job(): void {
		const action = settings.get('Livechat_max_queue_wait_time_action');
		this.logger.debug(`Processing dangling queued items with action ${ action }`);
		let counter = 0;
		if (!action || action === 'Nothing') {
			return;
		}

		LivechatInquiry.getUnnatendedQueueItems(moment().utc()).forEach((inquiry: any) => {
			switch (action) {
				case 'Close_chat': {
					counter++;
					this.closeRooms(LivechatRooms.findOneById(inquiry.rid));
					break;
				}
			}
		});

		this.logger.debug(`Running succesful. Closed ${ counter } queued items because of inactivity`);
	}
}

export const OmnichannelQueueInactivityMonitor = new OmnichannelQueueInactivityMonitorClass();

Meteor.startup(() => {
	OmnichannelQueueInactivityMonitor.start();
});
