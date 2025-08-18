import type { ICalendarNotification, IUser } from '@rocket.chat/core-typings';
import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import { imperativeModal } from '@rocket.chat/ui-client';
import { useStream, useUserPreference } from '@rocket.chat/ui-contexts';
import { useEffect } from 'react';

import OutlookCalendarEventModal from '../../views/outlookCalendar/OutlookCalendarEventModal';

export const useNotificationUserCalendar = (user: IUser) => {
	const requireInteraction = useUserPreference('desktopNotificationRequireInteraction');
	const notifyUserStream = useStream('notify-user');

	const notifyUserCalendar = useEffectEvent(async (notification: ICalendarNotification) => {
		if (user.status === 'busy') {
			return;
		}

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
	});

	useEffect(() => {
		if (!user?._id || !user.settings?.calendar?.outlook?.Enabled) {
			return;
		}

		return notifyUserStream(`${user._id}/calendar`, notifyUserCalendar);
	}, [notifyUserCalendar, notifyUserStream, user.settings?.calendar?.outlook?.Enabled, user?._id]);
};
