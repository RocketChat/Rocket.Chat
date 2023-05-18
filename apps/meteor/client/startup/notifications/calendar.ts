import type { IUser, ICalendarNotification } from '@rocket.chat/core-typings';
import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';

import { Notifications } from '../../../app/notifications/client';
import { getUserPreference } from '../../../app/utils/client';
import { imperativeModal } from '../../lib/imperativeModal';
import OutlookCalendarEventModal from '../../views/outlookCalendar/OutlookCalendarEventModal';

const onUserCalendar = async function (notification: ICalendarNotification): Promise<void> {
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
		imperativeModal.open({
			component: OutlookCalendarEventModal,
			props: { id: notification.payload._id, onClose: imperativeModal.close, onCancel: imperativeModal.close },
		});
	};
};

Tracker.autorun(async () => {
	if (!Meteor.userId()) {
		return Notifications.unUser('calendar');
	}

	return Notifications.onUser('calendar', onUserCalendar);
});
