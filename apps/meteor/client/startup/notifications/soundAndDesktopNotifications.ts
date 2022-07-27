import { IMessage, IRoom, ISubscription } from '@rocket.chat/core-typings';
import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';
import { Tracker } from 'meteor/tracker';

import { CachedChatSubscription } from '../../../app/models/client';
import { Notifications } from '../../../app/notifications/client';
import { readMessage } from '../../../app/ui-utils/client';
import { KonchatNotification } from '../../../app/ui/client';
import { getUserPreference } from '../../../app/utils/client';
import { fireGlobalEvent } from '../../lib/utils/fireGlobalEvent';
import { isLayoutEmbedded } from '../../lib/utils/isLayoutEmbedded';

type NotificationEvent = {
	title: string;
	text: string;
	duration: number;
	payload: {
		_id: IMessage['_id'];
		rid: IMessage['rid'];
		tmid: IMessage['_id'];
		sender: IMessage['u'];
		type: IRoom['t'];
		name: IRoom['name'];
		message: {
			msg: IMessage['msg'];
			t: string;
		};
	};
};

Meteor.startup(() => {
	Tracker.autorun(() => {
		if (!Meteor.userId()) {
			return;
		}

		/* The message notification is controlled by the server,
		 * after the client receives the stream there are two parts:
		 * 1. The user should receive the desktop notification "popup"
		 * 2. The user should be notified through sound
		 */
		Notifications.onUser('notification', (notification: NotificationEvent) => {
			const hasFocus = readMessage.isEnable();
			const muteFocusedConversations = getUserPreference(Meteor.userId(), 'muteFocusedConversations');
			const { rid } = notification.payload;
			const messageIsInOpenedRoom = hasFocus && Session.get('openedRoom') === notification.payload.rid;

			fireGlobalEvent('notification', {
				notification,
				fromOpenedRoom: messageIsInOpenedRoom,
				hasFocus,
			});

			/*
			 * If the user is using the embedded layout, we don't have sidebar neither the concept of more rooms,
			 * so if somehow the user receives a notification in a room that is not open, we don't show the notification.
			 */
			if (isLayoutEmbedded()) {
				if (messageIsInOpenedRoom) {
					KonchatNotification.showDesktop(notification);
					KonchatNotification.newMessageSound(rid);
				}
				return;
			}

			/*
			 * In the other hand, if the user is using the normal layout, we have the sidebar and multiple rooms,
			 * then want to show the notification only if the notification is not from the current one
			 */

			if (!messageIsInOpenedRoom) {
				KonchatNotification.showDesktop(notification);
			}

			/*
			 * Even so, the user has a setting to make 'plim' even if the notification is from the current room
			 */
			if (!messageIsInOpenedRoom || !muteFocusedConversations) {
				KonchatNotification.newMessageSound(rid);
			}
		});

		/* The new room notification is controlled by the client,
		 * as soon as the client receives the stream, containing the new subscription,
		 * the client triggers the sound notification
		 */
		const notifyNewRoom = (sub: ISubscription): void => {
			/* The logic used to infer if the room is new is the following:
			 * 1. If the subscription has no ls (lastSeen) property, it means that it was never opened before
			 * 2. If the subscription has the alert property set to true, this value is set by the server
			 */
			if (!sub.ls && sub.alert === true) {
				KonchatNotification.newRoomSound();
			}
		};
		CachedChatSubscription.onSyncData = ((action: 'changed' | 'removed', sub: ISubscription): void => {
			if (action !== 'removed') {
				notifyNewRoom(sub);
			}
		}) as () => void;

		Notifications.onUser('subscriptions-changed', (_action: 'changed' | 'removed', sub: ISubscription) => {
			notifyNewRoom(sub);
		});
	});
});
