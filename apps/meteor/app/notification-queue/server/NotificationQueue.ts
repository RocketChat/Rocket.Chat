import { Meteor } from 'meteor/meteor';
import type { INotification, INotificationItemPush, INotificationItemEmail, NotificationItem, IUser } from '@rocket.chat/core-typings';
import { NotificationQueue, Users } from '@rocket.chat/models';
import { config } from '@rocket.chat/config';

import { sendEmailFromData } from '../../lib/server/functions/notifications/email';
import { PushNotification } from '../../push-notifications/server';
import { SystemLogger } from '../../../server/lib/logger/system';

const {
	NOTIFICATIONS_WORKER_TIMEOUT,
	NOTIFICATIONS_BATCH_SIZE,
	NOTIFICATIONS_SCHEDULE_DELAY_ONLINE,
	NOTIFICATIONS_SCHEDULE_DELAY_AWAY,
	NOTIFICATIONS_SCHEDULE_DELAY_OFFLINE,
} = config;

class NotificationClass {
	private running = false;

	private cyclePause = NOTIFICATIONS_WORKER_TIMEOUT;

	private maxBatchSize = NOTIFICATIONS_BATCH_SIZE;

	private maxScheduleDelaySeconds: { [key: string]: number } = {
		online: NOTIFICATIONS_SCHEDULE_DELAY_ONLINE,
		away: NOTIFICATIONS_SCHEDULE_DELAY_AWAY,
		offline: NOTIFICATIONS_SCHEDULE_DELAY_OFFLINE,
	};

	initWorker(): void {
		this.running = true;
		this.executeWorkerLater();
	}

	stopWorker(): void {
		this.running = false;
	}

	executeWorkerLater(): void {
		if (!this.running) {
			return;
		}

		setTimeout(async () => {
			try {
				await this.worker();
			} catch (err) {
				SystemLogger.error({ msg: 'Error sending notification', err });
				this.executeWorkerLater();
			}
		}, this.cyclePause);
	}

	async worker(counter = 0): Promise<void> {
		const notification = await this.getNextNotification();

		if (!notification) {
			return this.executeWorkerLater();
		}

		// Once we start notifying the user we anticipate all the schedules
		const flush = await NotificationQueue.clearScheduleByUserId(notification.uid);

		// start worker again it queue flushed
		if (flush.modifiedCount) {
			await NotificationQueue.unsetSendingById(notification._id);
			return this.worker(counter);
		}

		try {
			for await (const item of notification.items) {
				switch (item.type) {
					case 'push':
						await this.push(notification, item);
						break;
					case 'email':
						await this.email(item);
						break;
				}
			}

			await NotificationQueue.removeById(notification._id);
		} catch (e) {
			SystemLogger.error(e);
			await NotificationQueue.setErrorById(notification._id, e instanceof Error ? e.message : String(e));
		}

		if (counter >= this.maxBatchSize) {
			return this.executeWorkerLater();
		}
		await this.worker(counter++);
	}

	getNextNotification(): Promise<INotification | null> {
		const expired = new Date();
		expired.setMinutes(expired.getMinutes() - 5);

		return NotificationQueue.findNextInQueueOrExpired(expired);
	}

	async push({ uid, rid, mid }: INotification, item: INotificationItemPush): Promise<void> {
		await PushNotification.send({
			rid,
			uid,
			mid,
			...item.data,
		});
	}

	async email(item: INotificationItemEmail): Promise<void> {
		return sendEmailFromData(item.data);
	}

	async scheduleItem({
		uid,
		rid,
		mid,
		items,
		user,
	}: {
		uid: string;
		rid: string;
		mid: string;
		items: NotificationItem[];
		user?: Partial<IUser>;
	}): Promise<void> {
		const receiver =
			user ||
			(await Users.findOneById<Pick<IUser, 'statusConnection'>>(uid, {
				projection: {
					statusConnection: 1,
				},
			}));

		if (!receiver) {
			return;
		}

		const { statusConnection = 'offline' } = receiver;

		let schedule: Date | undefined;

		const delay = this.maxScheduleDelaySeconds[statusConnection];

		if (delay < 0) {
			return;
		}
		if (delay > 0) {
			schedule = new Date();
			schedule.setSeconds(schedule.getSeconds() + delay);
		}

		await NotificationQueue.insertOne({
			uid,
			rid,
			mid,
			ts: new Date(),
			schedule,
			items,
		});
	}
}

export const Notification = new NotificationClass();

Meteor.startup(() => {
	Notification.initWorker();
});
