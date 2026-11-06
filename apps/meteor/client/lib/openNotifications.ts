import type { IRoom, ISubscription } from '@rocket.chat/core-typings';

const MAX_OPEN_NOTIFICATIONS = 50;

export class OpenNotifications {
	private readonly notifications = new Map<Notification, IRoom['_id']>();

	track(rid: IRoom['_id'], notification: Notification): void {
		this.notifications.set(notification, rid);
		notification.addEventListener?.('close', () => this.notifications.delete(notification));

		if (this.notifications.size > MAX_OPEN_NOTIFICATIONS) {
			const [oldest] = this.notifications.keys();
			this.close(oldest);
		}
	}

	closeNotificationsOfReadRoom({ rid, alert, unread, tunread }: Pick<ISubscription, 'rid' | 'alert' | 'unread' | 'tunread'>): void {
		if (alert || unread > 0 || tunread?.length) {
			return;
		}

		for (const [notification, notificationRid] of this.notifications) {
			if (notificationRid === rid) {
				this.close(notification);
			}
		}
	}

	private close(notification: Notification): void {
		this.notifications.delete(notification);
		notification.close();
	}
}

export const openNotifications = new OpenNotifications();
