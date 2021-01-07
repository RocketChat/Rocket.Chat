import Agenda from 'agenda';
import { MongoInternals } from 'meteor/mongo';

import { Users } from '../../../../../app/models/server';
import { autoTransferVisitorJob } from './jobs';

export class AutoTransferMonitor {
	private static _instance: AutoTransferMonitor;

	schedular: Agenda;

	userToPerformAutomaticTransfer: any;

	private constructor(schedular: Agenda) {
		this.schedular = schedular;
	}

	public static get Instance(): AutoTransferMonitor {
		if (!this._instance) {
			const schedular = new Agenda({
				mongo: (MongoInternals.defaultRemoteCollectionDriver().mongo as any).client.db(),
				db: { collection: 'livechat_scheduler' },
				// this ensures the same job doesn't get executed multiple times in a cluster
				defaultConcurrency: 1,
			});
			this._instance = new this(schedular);
			this._instance.schedular.start();
			const user = Users.findOneById('rocket.cat');
			this._instance.userToPerformAutomaticTransfer = user;
		}
		return this._instance;
	}

	public async startMonitoring(room: any, timeout: number): Promise<void> {
		const { _id: roomId } = room;
		const jobName = `livechat-auto-transfer-${ roomId }`;
		const when = this.addMinutesToDate(new Date(), timeout);

		this.schedular.define(jobName, autoTransferVisitorJob);

		await this.schedular.schedule(when, jobName, { room, transferredBy: this.userToPerformAutomaticTransfer });
	}

	public async stopMonitoring(roomId: string): Promise<void> {
		const jobName = `livechat-auto-transfer-${ roomId }`;

		const cancelledJobs = await this.schedular.cancel({ name: jobName });
		// TODO: remove this console log
		console.log('---cancelledJobs', cancelledJobs);
	}

	private addMinutesToDate(date: Date, minutes: number): Date {
		return new Date(date.getTime() + minutes * 1000 * 60);
	}
}
