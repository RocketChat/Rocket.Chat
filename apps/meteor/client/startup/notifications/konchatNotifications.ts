import type { IUser, ICalendarNotification } from '@rocket.chat/core-typings';
import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';
import { lazy } from 'react';

import { settings } from '../../../app/settings/client';
import { getUserPreference } from '../../../app/utils/client';
import { sdk } from '../../../app/utils/client/lib/SDKClient';
import { imperativeModal } from '../../lib/imperativeModal';

const OutlookCalendarEventModal = lazy(() => import('../../views/outlookCalendar/OutlookCalendarEventModal'));

Meteor.startup(() => {
	const notifyUserCalendar = async function (notification: ICalendarNotification): Promise<void> {
		const user = Meteor.user() as IUser | null;
		if (!user || user.status === 'busy') {
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

	Tracker.autorun(() => {
		if (!Meteor.userId() || !settings.get('Outlook_Calendar_Enabled')) {
			sdk.stop('notify-user', `${Meteor.userId()}/calendar`);
			return;
		}

		sdk.stream('notify-user', [`${Meteor.userId()}/calendar`], notifyUserCalendar);
	});
});
