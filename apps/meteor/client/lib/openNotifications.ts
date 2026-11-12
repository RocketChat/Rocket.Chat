import type { IMessage, ISubscription } from '@rocket.chat/core-typings';

const MAX_OPEN_NOTIFICATIONS = 50;

type NotificationOrigin = {
	rid: IMessage['rid'];
	tmid?: IMessage['tmid'];
	ls?: ISubscription['ls'];
	tunread?: ISubscription['tunread'];
};

type SubscriptionReadState = {
	rid: ISubscription['rid'];
	ls?: ISubscription['ls'];
	alert?: ISubscription['alert'];
	unread?: ISubscription['unread'];
	tunread?: ISubscription['tunread'];
};

type OpenNotification = {
	rid: IMessage['rid'];
	tmid?: IMessage['tmid'];
	lastSeen?: Date;
	threadUnreadSeen: boolean;
};

const getTime = (date: Date | string | undefined) => (date === undefined ? undefined : new Date(date).getTime());

/** Tells whether a subscription's last-seen time was set or moved past an earlier one, which only happens when the room is read. */
export const isSeenLater = (lastSeen: Date | string | undefined, earlierLastSeen: Date | string | undefined): boolean => {
	const time = getTime(lastSeen);
	const earlierTime = getTime(earlierLastSeen);
	return time !== undefined && (earlierTime === undefined || time > earlierTime);
};

/** Keeps the desktop notifications that are still open, so they can be closed once their messages are read. */
export class OpenNotifications {
	private readonly notifications = new Map<Notification, OpenNotification>();

	private session = 0;

	/** Identifies the user session, so a notification prepared before a user change is not shown. */
	get currentSession(): number {
		return this.session;
	}

	track(notification: Notification, { rid, tmid, ls, tunread }: NotificationOrigin): void {
		this.notifications.set(notification, {
			rid,
			tmid,
			lastSeen: ls,
			threadUnreadSeen: !!tmid && !!tunread?.includes(tmid),
		});
		notification.addEventListener?.('close', () => this.notifications.delete(notification));

		if (this.notifications.size > MAX_OPEN_NOTIFICATIONS) {
			const [oldest] = this.notifications.keys();
			this.close(oldest);
		}
	}

	closeReadNotifications(subscription: SubscriptionReadState): void {
		for (const [notification, origin] of this.notifications) {
			if (origin.rid !== subscription.rid) {
				continue;
			}

			if (!origin.tmid) {
				if (this.isRoomRead(origin, subscription)) {
					this.close(notification);
				}
				continue;
			}

			if (subscription.tunread?.includes(origin.tmid)) {
				origin.threadUnreadSeen = true;
				continue;
			}

			if (origin.threadUnreadSeen || this.isRoomRead(origin, subscription)) {
				this.close(notification);
			}
		}
	}

	closeRoomNotifications(rid: IMessage['rid']): void {
		for (const [notification, origin] of this.notifications) {
			if (origin.rid === rid) {
				this.close(notification);
			}
		}
	}

	closeAll(): void {
		this.session += 1;
		for (const notification of this.notifications.keys()) {
			this.close(notification);
		}
	}

	private isRoomRead(origin: OpenNotification, subscription: SubscriptionReadState): boolean {
		if (origin.lastSeen === undefined || subscription.ls === undefined) {
			return !subscription.alert && !subscription.unread;
		}

		return isSeenLater(subscription.ls, origin.lastSeen);
	}

	private close(notification: Notification): void {
		this.notifications.delete(notification);
		notification.close();
	}
}

export const openNotifications = new OpenNotifications();
