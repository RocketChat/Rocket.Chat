
export class AppNotificationsConverter {
	constructor(orch) {
		this.orch = orch;
	}

	convertToApp(notification) {
		if (!notification) {
			return undefined;
		}

		const messagesConverter = this.orch.getConverters().get('messages');
		const usersConverter = this.orch.getConverters().get('users');

		const convertedNotification = {
			message: notification.notificationMessage,
			triggerMessage: messagesConverter.convertMessage(notification.message),
			sender: usersConverter.convertToApp(notification.sender),
			receiver: usersConverter.convertToApp(notification.receiver),
			customFields: notification.customFields || {},
		};

		return convertedNotification;
	}

	convertFromApp(notification) {
		if (!notification) {
			return undefined;
		}

		const convertedNotification = {
			notificationMessage: notification.message,
			customFields: notification.customFields,
		};

		return convertedNotification;
	}
}

export class AppDesktopNotificationsConverter {
	constructor(orch) {
		this.orch = orch;
	}

	convertToApp(notification) {
		if (!notification) {
			return undefined;
		}

		const { title, text, duration } = notification;

		const notificationsConverter = this.orch.getConverters().get('notifications');

		const convertedNotification = {
			title,
			text,
			duration,
			...notificationsConverter.convertToApp(notification),
		};

		return convertedNotification;
	}

	convertFromApp(notification) {
		if (!notification) {
			return undefined;
		}

		const { title, text, duration } = notification;

		const notificationsConverter = this.orch.getConverters().get('notifications');

		const convertedNotification = {
			title,
			text,
			duration,
			...notificationsConverter.convertFromApp(notification),
		};

		return convertedNotification;
	}
}
