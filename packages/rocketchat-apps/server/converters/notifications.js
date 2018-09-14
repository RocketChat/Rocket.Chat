
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
		};

		return convertedNotification;
	}

	convertFromApp(notification) {
		if (!notification) {
			return undefined;
		}

		const convertedNotification = {
			notificationMessage: notification.message,
		};

		return convertedNotification;
	}
}
