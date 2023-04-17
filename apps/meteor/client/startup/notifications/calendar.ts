import type { IUser, ICalendarNotification } from '@rocket.chat/core-typings';
import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';

import { Notifications } from '../../../app/notifications/client';
import { getUserPreference } from '../../../app/utils/client';

const onUserCalendar = async function(notification: ICalendarNotification): Promise<void> {
	if (((await Meteor.userAsync()) as IUser | null)?.status === 'busy') {
		return;
	}

	const requireInteraction = getUserPreference<boolean>(Meteor.userId(), 'desktopNotificationRequireInteraction');

	const n = new Notification(notification.title, {
		body: notification.text,
		tag: notification.payload._id,
		silent: true,
		requireInteraction,
	} as NotificationOptions);

	n.onclick = function () {
		this.close();
		window.focus();
	};
};

Tracker.autorun(async () => {
	if (!Meteor.userId()) {
		return Notifications.unUser('calendar', onUserCalendar);
	}

	return Notifications.onUser('calendar', onUserCalendar);
});
