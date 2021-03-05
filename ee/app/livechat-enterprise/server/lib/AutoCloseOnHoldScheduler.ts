import Agenda from 'agenda';
import { MongoInternals } from 'meteor/mongo';
import { Meteor } from 'meteor/meteor';
import moment from 'moment';

import { Livechat } from '../../../../../app/livechat/server';
import { LivechatRooms, Users } from '../../../../../app/models/server';

const schedulerUser = Users.findOneById('rocket.cat');
const SCHEDULER_NAME = 'omnichannel_auto_close_on_hold_scheduler';

class AutoCloseOnHoldSchedulerClass {
	scheduler: Agenda;

	running: boolean;

	public init(): void {
		console.log('----staring AutoCloseOnHoldSchedulerClass');
		if (this.running) {
			return;
		}

		this.scheduler = new Agenda({
			mongo: (MongoInternals.defaultRemoteCollectionDriver().mongo as any).client.db(),
			db: { collection: SCHEDULER_NAME },
			defaultConcurrency: 1,
		});

		this.scheduler.start();
		this.running = true;
	}

	public async scheduleRoom(roomId: string, timeout: number, comment: string): Promise<void> {
		await this.unscheduleRoom(roomId);

		const jobName = `${ SCHEDULER_NAME }-${ roomId }`;
		// TODO: remove this
		const when = moment(new Date()).add(timeout, 's').toDate();
		// const when = moment(new Date()).add(timeout, 'm').toDate();

		this.scheduler.define(jobName, this.executeJob.bind(this));
		await this.scheduler.schedule(when, jobName, { roomId, comment });
	}


	public async unscheduleRoom(roomId: string): Promise<void> {
		const jobName = `${ SCHEDULER_NAME }-${ roomId }`;
		await this.scheduler.cancel({ name: jobName });
	}

	private async executeJob({ attrs: { data } }: any = {}): Promise<void> {
		console.log('---executeJob called', data);

		const { roomId, comment } = data;

		const payload = {
			user: schedulerUser,
			room: await LivechatRooms.findOneById(roomId),
			comment,
			options: {},
			visitor: undefined,
		};

		console.log('--payload', payload);

		const result = Livechat.closeRoom(payload);
		console.log('---result', result);
	}
}

export const AutoCloseOnHoldScheduler = new AutoCloseOnHoldSchedulerClass();

Meteor.startup(() => {
	console.log('---from meteor startup - AutoCloseOnHoldScheduler');
	AutoCloseOnHoldScheduler.init();
});
