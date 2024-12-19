import type { INotification, INotificationItemPush, INotificationItemEmail, NotificationItem, IUser } from '@rocket.chat/core-typings';
import { NotificationQueue, Users } from '@rocket.chat/models';
import { tracerSpan } from '@rocket.chat/tracing';
import { Meteor } from 'meteor/meteor';

import { SystemLogger } from '../../../server/lib/logger/system';
import { sendEmailFromData } from '../../lib/server/functions/notifications/email';
import { PushNotification } from '../../push-notifications/server';

const {
	NOTIFICATIONS_WORKER_TIMEOUT = 2000,
	NOTIFICATIONS_BATCH_SIZE = 100,
	NOTIFICATIONS_SCHEDULE_DELAY_ONLINE = 120,
	NOTIFICATIONS_SCHEDULE_DELAY_AWAY = 0,
	NOTIFICATIONS_SCHEDULE_DELAY_OFFLINE = 0,
} = process.env;

class NotificationClass {
	private running = false;

	private cyclePause = Number(NOTIFICATIONS_WORKER_TIMEOUT);

	private maxBatchSize = Number(NOTIFICATIONS_BATCH_SIZE);

	private maxScheduleDelaySeconds: { [key: string]: number } = {
		online: Number(NOTIFICATIONS_SCHEDULE_DELAY_ONLINE),
		away: Number(NOTIFICATIONS_SCHEDULE_DELAY_AWAY),
		offline: Number(NOTIFICATIONS_SCHEDULE_DELAY_OFFLINE),
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
				const continueLater = await tracerSpan(
					'NotificationWorker',
					{
						attributes: {
							workerTime: new Date().toISOString(),
						},
					},
					() => this.worker(),
				);

				if (continueLater) {
					this.executeWorkerLater();
				}
			} catch (err) {
				SystemLogger.error({ msg: 'Error sending notification', err });
				this.executeWorkerLater();
			}
		}, this.cyclePause);
	}

	async worker(counter = 0): Promise<boolean> {
		const notification = await this.getNextNotification();

		if (!notification) {
			return true;
		}

		// Once we start notifying the user we anticipate all the schedules
		const flush = await NotificationQueue.clearScheduleByUserId(notification.uid);

		// start worker again if queue flushed
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
			return true;
		}

		return this.worker(++counter);
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
