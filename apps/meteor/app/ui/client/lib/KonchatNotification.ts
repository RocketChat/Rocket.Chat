import { ReactiveVar } from 'meteor/reactive-var';

declare global {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface NotificationEventMap {
		reply: { response: string };
	}
}

class KonchatNotification {
	public notificationStatus = new ReactiveVar<NotificationPermission | undefined>(undefined);

	public getDesktopPermission() {
		if (window.Notification && Notification.permission !== 'granted') {
			return Notification.requestPermission((status) => {
				this.notificationStatus.set(status);
			});
		}
	}
}

const instance = new KonchatNotification();

export { instance as KonchatNotification };
