import { Meteor } from 'meteor/meteor';

import { INotification, INotificationItemPush, INotificationItemEmail, NotificationItem } from '../../../definition/INotification';
import { NotificationQueue, Users } from '../../models/server/raw';
import { sendEmailFromData } from '../../lib/server/functions/notifications/email';
import { PushNotification } from '../../push-notifications/server';
import { IUser } from '../../../definition/IUser';

const {
	NOTIFICATIONS_WORKER_TIMEOUT = 2000,
	NOTIFICATIONS_BATCH_SIZE = 100,
	NOTIFICATIONS_SCHEDULE_DELAY_ONLINE = -1,
	NOTIFICATIONS_SCHEDULE_DELAY_AWAY = 120,
	NOTIFICATIONS_SCHEDULE_DELAY_OFFLINE = 0,
} = process.env;

class NotificationClass {
	private running = false;

	private cyclePause = Number(NOTIFICATIONS_WORKER_TIMEOUT);

	private maxBatchSize = Number(NOTIFICATIONS_BATCH_SIZE);

	private maxScheduleDelaySecondsOnline = Number(NOTIFICATIONS_SCHEDULE_DELAY_ONLINE);

	private maxScheduleDelaySecondsAway = Number(NOTIFICATIONS_SCHEDULE_DELAY_AWAY);

	private maxScheduleDelaySecondsOffline = Number(NOTIFICATIONS_SCHEDULE_DELAY_OFFLINE);

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

		setTimeout(this.worker.bind(this), this.cyclePause);
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
			for (const item of notification.items) {
				switch (item.type) {
					case 'push':
						this.push(notification, item);
						break;
					case 'email':
						this.email(item);
						break;
				}
			}

			NotificationQueue.removeById(notification._id);
		} catch (e) {
			console.error(e);
			await NotificationQueue.unsetSendingById(notification._id);
		}

		if (counter >= this.maxBatchSize) {
			return this.executeWorkerLater();
		}
		this.worker(counter++);
	}

	getNextNotification(): Promise<INotification | undefined> {
		const expired = new Date();
		expired.setMinutes(expired.getMinutes() - 5);

		return NotificationQueue.findNextInQueueOrExpired(expired);
	}

	push({ uid, rid, mid }: INotification, item: INotificationItemPush): void {
		PushNotification.send({
			rid,
			uid,
			mid,
			...item.data,
		});
	}

	email(item: INotificationItemEmail): void {
		sendEmailFromData(item.data);
	}

	async scheduleItem({ uid, rid, mid, items, user }: { uid: string; rid: string; mid: string; items: NotificationItem[]; user?: Partial<IUser> }): Promise<void> {
		const receiver = user || await Users.findOneById(uid, {
			projection: {
				statusConnection: 1,
			},
		});

		if (!receiver) {
			return;
		}

		let schedule: Date | undefined;

		if (receiver.statusConnection === 'online') {
			if (this.maxScheduleDelaySecondsOnline === -1) {
				return;
			}

			schedule = new Date();
			schedule.setSeconds(schedule.getSeconds() + this.maxScheduleDelaySecondsOnline);
		} else if (receiver.statusConnection === 'away') {
			if (this.maxScheduleDelaySecondsAway === -1) {
				return;
			}

			const elapsedSeconds = Math.floor((Date.now() - receiver._updatedAt) / 1000);
			if (elapsedSeconds < this.maxScheduleDelaySecondsAway) {
				schedule = new Date();
				schedule.setSeconds(schedule.getSeconds() + this.maxScheduleDelaySecondsAway - elapsedSeconds);
			}
		} else if (receiver.statusConnection === 'offline') {
			if (this.maxScheduleDelaySecondsOffline === -1) {
				return;
			}

			schedule = new Date();
			schedule.setSeconds(schedule.getSeconds() + this.maxScheduleDelaySecondsOffline);
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
