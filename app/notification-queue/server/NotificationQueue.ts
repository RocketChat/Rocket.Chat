import { Collection, ObjectId } from 'mongodb';

import { NotificationQueue, Subscriptions } from '../../models/server/raw';
import { sendEmailFromData } from '../../lib/server/functions/notifications/email';
import { PushNotification } from '../../push-notifications/server';

const SubscriptionsCollection: Collection = Subscriptions.col;

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
		usersTo: {
			userId: string;
		};
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
	sending?: Date;
	items: NotificationItem[];
}

class NotificationClass {
	public readonly collection: Collection<INotification> = NotificationQueue.col

	private running = false;

	private delay = 2000;

	private maxBatchSize = 5;

	private resetPendingInterval?: NodeJS.Timer;

	private resetPendingDelay = 5 * 60 * 1000;

	initWorker(): void {
		this.running = true;
		this.executeWorkerLater();

		this.resetPendingInterval = setInterval(() => {
			const date = new Date();
			date.setMinutes(date.getMinutes() - 5);
			this.collection.updateMany({
				sending: { $lt: date },
			}, {
				$unset: {
					sending: 1,
				},
			});
		}, this.resetPendingDelay);
	}

	stopWorker(): void {
		this.running = false;
		if (this.resetPendingInterval) {
			clearInterval(this.resetPendingInterval);
		}
	}

	executeWorkerLater(): void {
		if (!this.running) {
			return;
		}

		setTimeout(this.worker.bind(this), this.delay);
	}

	async worker(counter = 0): Promise<void> {
		console.log('working');
		const notification = (await this.collection.findOneAndUpdate({
			sending: { $exists: false },
			ts: { $lt: new Date() },
		}, {
			$set: {
				sending: new Date(),
			},
		}, {
			sort: {
				ts: -1,
			},
		})).value;

		if (!notification) {
			return this.executeWorkerLater();
		}

		console.log('processing', notification._id);

		try {
			for (const item of notification.items) {
				switch (item.type) {
					case 'push':
						this.push(item);
						break;
					// case 'email':
					// 	this.email(item);
					// 	break;
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

	push(item: INotificationItemPush): void {
		PushNotification.send(item.data);
	}

	email(item: INotificationItemEmail): void {
		sendEmailFromData(item.data);
	}

	async scheduleItem({ uid, rid, sid, items }: {uid: string; rid: string; sid: string; items: NotificationItem[]}): Promise<void> {
		// TODO: ls only changes when the channel is marked as read or when using ESC
		// need to find another way
		const sub = await SubscriptionsCollection.findOne({
			'u._id': uid,
		}, {
			projection: {
				ls: 1,
			},
			sort: {
				ls: -1,
			},
		});

		const delay = 120;

		const ts = new Date();

		if (sub?.ls) {
			const elapsedSeconds = Math.floor((Date.now() - sub.ls) / 1000);
			if (elapsedSeconds < delay) {
				console.log(delay - elapsedSeconds);
				ts.setSeconds(ts.getSeconds() + delay - elapsedSeconds);
			}
		} else {
			console.log(delay);
			ts.setSeconds(ts.getSeconds() + delay);
		}

		await this.collection.insertOne({
			_id: new ObjectId().toString(),
			uid,
			rid,
			sid,
			ts,
			items,
		});
	}
}

export const Notification = new NotificationClass();
Notification.initWorker();
