/* global Apps */

/**
 * Send notification to user
 *
 * @param {string} notificationPayload The notification complete payload, containing the message to be sent
 * @param {string} userId The user to notify
 * @param {object} room The room send from
 * @param {number} duration Duration of notification
 * @returns {boolean} Whether the notification has been successfully sent or not
 */
export function notifyDesktopUser({
	notificationPayload,
	userId,
	room,
	duration,
}) {
	const { title, text } = RocketChat.roomTypes.getConfig(room.t).getNotificationDetails(room, notificationPayload.sender, notificationPayload.notificationMessage);

	const desktopNotificationPayload = {
		title,
		text,
		duration,
		...notificationPayload,
	};

	const isAppsLoaded = (Apps && Apps.isLoaded());

	if (isAppsLoaded) {
		const prevent = Promise.await(Apps.getBridges().getListenerBridge().desktopNotificationEvent('IPreDesktopNotificationSentPrevent', desktopNotificationPayload));

		if (prevent) {
			console.log('A Rocket.Chat App prevented desktop notifications from being sent');

			return false;
		}

		let result;

		result = Promise.await(Apps.getBridges().getListenerBridge().desktopNotificationEvent('IPreDesktopNotificationSentExtend', desktopNotificationPayload));
		result = Promise.await(Apps.getBridges().getListenerBridge().desktopNotificationEvent('IPreDesktopNotificationSentModify', result));

		if (typeof result === 'object') {
			Object.assign(desktopNotificationPayload, result);
		}
	}

	RocketChat.metrics.notificationsSent.inc({ notification_type: 'desktop' });
	RocketChat.Notifications.notifyUser(userId, 'notification', {
		title: desktopNotificationPayload.title,
		text: desktopNotificationPayload.text,
		duration: desktopNotificationPayload.duration,
		payload: {
			_id: desktopNotificationPayload.message._id,
			rid: desktopNotificationPayload.message.rid,
			sender: desktopNotificationPayload.message.u,
			type: room.t,
			name: room.name,
		},
	});

	if (isAppsLoaded) {
		// Even though we have no use for the return of this event
		// we should wait for the calls to finish before returning
		// to the rest of the application flow
		Promise.await(Apps.getBridges().getListenerBridge().desktopNotificationEvent('IPostDesktopNotificationSent', desktopNotificationPayload));
	}

	return true;
}

export function shouldNotifyDesktop({
	disableAllMessageNotifications,
	status,
	desktopNotifications,
	hasMentionToAll,
	hasMentionToHere,
	isHighlighted,
	hasMentionToUser,
	roomType,
}) {
	if (disableAllMessageNotifications && desktopNotifications == null) {
		return false;
	}

	if (status === 'busy' || desktopNotifications === 'nothing') {
		return false;
	}

	if (!desktopNotifications) {
		if (RocketChat.settings.get('Accounts_Default_User_Preferences_desktopNotifications') === 'all') {
			return true;
		}
		if (RocketChat.settings.get('Accounts_Default_User_Preferences_desktopNotifications') === 'nothing') {
			return false;
		}
	}

	return roomType === 'd' || (!disableAllMessageNotifications && (hasMentionToAll || hasMentionToHere)) || isHighlighted || desktopNotifications === 'all' || hasMentionToUser;
}
