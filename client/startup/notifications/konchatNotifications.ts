import { FlowRouter } from 'meteor/kadira:flow-router';
import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';
import { Tracker } from 'meteor/tracker';

import { CachedChatSubscription } from '../../../app/models/client';
import { Notifications } from '../../../app/notifications/client';
import { fireGlobalEvent, readMessage, Layout } from '../../../app/ui-utils/client';
import { KonchatNotification } from '../../../app/ui/client';
import { getUserPreference } from '../../../app/utils/client';
import { IMessage } from '../../../definition/IMessage';
import { IRoom } from '../../../definition/IRoom';
import { ISubscription } from '../../../definition/ISubscription';

const notifyNewRoom = (sub: ISubscription): void => {
	if (Session.equals(`user_${Meteor.userId()}_status`, 'busy')) {
		return;
	}

	if (
		(!FlowRouter.getParam('name') || FlowRouter.getParam('name') !== sub.name) &&
		!sub.ls &&
		sub.alert === true
	) {
		KonchatNotification.newRoom(sub.rid);
	}
};

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

type AudioNotificationEvent = {
	payload: {
		_id: IMessage['_id'];
		rid: IMessage['rid'];
		sender: IMessage['u'];
		type: IRoom['t'];
		name: IRoom['name'];
	};
};

Meteor.startup(() => {
	Tracker.autorun(() => {
		if (!Meteor.userId()) {
			return;
		}

		Notifications.onUser('notification', (notification: NotificationEvent) => {
			let openedRoomId = undefined;
			if (['channel', 'group', 'direct'].includes(FlowRouter.getRouteName())) {
				openedRoomId = Session.get('openedRoom');
			}

			// This logic is duplicated in /client/startup/unread.coffee.
			const hasFocus = readMessage.isEnable();
			const messageIsInOpenedRoom = openedRoomId === notification.payload.rid;

			fireGlobalEvent('notification', {
				notification,
				fromOpenedRoom: messageIsInOpenedRoom,
				hasFocus,
			});

			if (Layout.isEmbedded()) {
				if (!hasFocus && messageIsInOpenedRoom) {
					// Show a notification.
					KonchatNotification.showDesktop(notification);
				}
			} else if (!hasFocus || !messageIsInOpenedRoom) {
				// Show a notification.
				KonchatNotification.showDesktop(notification);
			}
		});

		Notifications.onUser('audioNotification', (notification: AudioNotificationEvent) => {
			const openedRoomId = Session.get('openedRoom');

			// This logic is duplicated in /client/startup/unread.coffee.
			const hasFocus = readMessage.isEnable();
			const messageIsInOpenedRoom = openedRoomId === notification.payload.rid;
			const muteFocusedConversations = getUserPreference(
				Meteor.userId(),
				'muteFocusedConversations',
			);

			if (Layout.isEmbedded()) {
				if (!hasFocus && messageIsInOpenedRoom) {
					// Play a notification sound
					KonchatNotification.newMessage(notification.payload.rid);
				}
			} else if (!hasFocus || !messageIsInOpenedRoom || !muteFocusedConversations) {
				// Play a notification sound
				KonchatNotification.newMessage(notification.payload.rid);
			}
		});

		CachedChatSubscription.onSyncData = ((
			action: 'changed' | 'removed',
			sub: ISubscription,
		): void => {
			if (action !== 'removed') {
				notifyNewRoom(sub);
			}
		}) as () => void;

		Notifications.onUser(
			'subscriptions-changed',
			(_action: 'changed' | 'removed', sub: ISubscription) => {
				notifyNewRoom(sub);
			},
		);
	});
});
