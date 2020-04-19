import { Meteor } from 'meteor/meteor';
import { Collection, ObjectId } from 'mongodb';

import { NotificationQueue, Users } from '../../models/server/raw';
import { sendEmailFromData } from '../../lib/server/functions/notifications/email';
import { PushNotification } from '../../push-notifications/server';

const UsersCollection: Collection = Users.col;

interface INotificationItemPush {
	type: 'push';
	data: {
		roomId: string;
		payload: {
			host: string;
			rid: string;
			sender: {
				_id: string;
				username: string;
				name?: string;
			};
			type: string;
			messageId: string;
		};
		roomName: string;
		username: string;
		message: string;
		badge: number;
		userId: string;
		category: string;
	};
}

interface INotificationItemEmail {
	type: 'email';
	data: {
		to: string;
		subject: string;
		html: string;
		data: {
			room_path: string;
		};
		from: string;
	};
}

type NotificationItem = INotificationItemPush | INotificationItemEmail;

interface INotification {
	_id: string;
	uid: string;
	rid: string;
	sid: string;
	ts: Date;
	schedule?: Date;
	sending?: Date;
	items: NotificationItem[];
}

class NotificationClass {
	public readonly collection: Collection<INotification> = NotificationQueue.col

	private running = false;

	private cyclePause = 2000;

	private maxBatchSize = 100;

	private maxScheduleDelaySeconds = 120

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
		this.flushQueueForUser(notification.uid);

		console.log('processing', notification._id);

		try {
			for (const item of notification.items) {
				switch (item.type) {
					case 'push':
						this.push(item);
						break;
					case 'email':
						this.email(item);
						break;
				}
			}

			this.collection.deleteOne({
				_id: notification._id,
			});
		} catch (e) {
			console.error(e);
			this.collection.updateOne({
				_id: notification._id,
			}, {
				$unset: {
					sending: 1,
				},
			});
		}

		if (counter >= this.maxBatchSize) {
			return this.executeWorkerLater();
		}
		this.worker(counter++);
	}

	async flushQueueForUser(userId: string): Promise<void> {
		await this.collection.updateMany({
			uid: userId,
			schedule: { $exists: true },
		}, {
			$unset: {
				schedule: 1,
			},
		});
	}

	async getNextNotification(): Promise<INotification | undefined> {
		const now = new Date();
		const expired = new Date();
		expired.setMinutes(expired.getMinutes() - 5);

		return (await this.collection.findOneAndUpdate({
			$and: [{
				$or: [
					{ sending: { $exists: false } },
					{ sending: { $lte: expired } },
				],
			}, {
				$or: [
					{ schedule: { $exists: false } },
					{ schedule: { $lte: now } },
				],
			}],
		}, {
			$set: {
				sending: now,
			},
		}, {
			sort: {
				ts: 1,
			},
		})).value;
	}

	push(item: INotificationItemPush): void {
		PushNotification.send(item.data);
	}

	email(item: INotificationItemEmail): void {
		sendEmailFromData(item.data);
	}

	async scheduleItem({ uid, rid, sid, items }: {uid: string; rid: string; sid: string; items: NotificationItem[]}): Promise<void> {
		const user = await UsersCollection.findOne({
			_id: uid,
		}, {
			projection: {
				statusConnection: 1,
				_updatedAt: 1,
			},
		});

		if (!user) {
			return;
		}

		const delay = this.maxScheduleDelaySeconds;

		let schedule: Date | undefined;

		if (user.statusConnection === 'online') {
			schedule = new Date();
			schedule.setSeconds(schedule.getSeconds() + delay);
		} else if (user.statusConnection === 'away') {
			const elapsedSeconds = Math.floor((Date.now() - user._updatedAt) / 1000);
			if (elapsedSeconds < delay) {
				schedule = new Date();
				schedule.setSeconds(schedule.getSeconds() + delay - elapsedSeconds);
			}
		}

		await this.collection.insertOne({
			_id: new ObjectId().toString(),
			uid,
			rid,
			sid,
			ts: new Date(),
			schedule,
			items,
		});
	}

	async clearQueueForUser(userId: string): Promise<number | undefined> {
		const op = await this.collection.deleteMany({
			uid: userId,
		});

		return op.deletedCount;
	}
}

export const Notification = new NotificationClass();

Meteor.startup(() => {
	Notification.initWorker();
});
