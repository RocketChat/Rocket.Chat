import type { AtLeast, ISubscription, IUser, ICalendarNotification } from '@rocket.chat/core-typings';
import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';
import { lazy } from 'react';

import { CachedChatSubscription } from '../../../app/models/client';
import { Notifications } from '../../../app/notifications/client';
import { settings } from '../../../app/settings/client';
import { KonchatNotification } from '../../../app/ui/client/lib/KonchatNotification';
import { getUserPreference } from '../../../app/utils/client';
import { RoomManager } from '../../lib/RoomManager';
import { imperativeModal } from '../../lib/imperativeModal';
import { fireGlobalEvent } from '../../lib/utils/fireGlobalEvent';
import { isLayoutEmbedded } from '../../lib/utils/isLayoutEmbedded';
import { router } from '../../providers/RouterProvider';

const OutlookCalendarEventModal = lazy(() => import('../../views/outlookCalendar/OutlookCalendarEventModal'));

const notifyNewRoom = async (sub: AtLeast<ISubscription, 'rid'>): Promise<void> => {
	const user = Meteor.user() as IUser | null;
	if (!user || user.status === 'busy') {
		return;
	}

	if ((!router.getRouteParameters().name || router.getRouteParameters().name !== sub.name) && !sub.ls && sub.alert === true) {
		KonchatNotification.newRoom(sub.rid);
	}
};

function notifyNewMessageAudio(rid?: string): void {
	// This logic is duplicated in /client/startup/unread.coffee.
	const hasFocus = document.hasFocus();
	const messageIsInOpenedRoom = RoomManager.opened === rid;
	const muteFocusedConversations = getUserPreference(Meteor.userId(), 'muteFocusedConversations');

	if (isLayoutEmbedded()) {
		if (!hasFocus && messageIsInOpenedRoom) {
			// Play a notification sound
			void KonchatNotification.newMessage(rid);
		}
	} else if (!hasFocus || !messageIsInOpenedRoom || !muteFocusedConversations) {
		// Play a notification sound
		void KonchatNotification.newMessage(rid);
	}
}

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
			return Notifications.unUser('calendar');
		}

		Notifications.onUser('calendar', notifyUserCalendar);
	});

	Tracker.autorun(() => {
		if (!Meteor.userId()) {
			return;
		}
		Notifications.onUser('notification', (notification) => {
			const openedRoomId = ['channel', 'group', 'direct'].includes(router.getRouteName()!) ? RoomManager.opened : undefined;

			// This logic is duplicated in /client/startup/unread.coffee.
			const hasFocus = document.hasFocus();
			const messageIsInOpenedRoom = openedRoomId === notification.payload.rid;

			fireGlobalEvent('notification', {
				notification,
				fromOpenedRoom: messageIsInOpenedRoom,
				hasFocus,
			});

			if (isLayoutEmbedded()) {
				if (!hasFocus && messageIsInOpenedRoom) {
					// Show a notification.
					KonchatNotification.showDesktop(notification);
				}
			} else if (!hasFocus || !messageIsInOpenedRoom) {
				// Show a notification.
				KonchatNotification.showDesktop(notification);
			}

			notifyNewMessageAudio(notification.payload.rid);
		});

		CachedChatSubscription.on('changed', (sub): void => {
			void notifyNewRoom(sub);
		});

		Notifications.onUser('subscriptions-changed', (action, sub) => {
			if (action === 'removed') {
				return;
			}
			void notifyNewRoom(sub);
		});
	});
});
