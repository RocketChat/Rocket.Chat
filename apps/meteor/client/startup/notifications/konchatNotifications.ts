import type { ISubscription, IUser } from '@rocket.chat/core-typings';
import { FlowRouter } from 'meteor/kadira:flow-router';
import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';

import { CachedChatSubscription } from '../../../app/models/client';
import { Notifications } from '../../../app/notifications/client';
import { readMessage } from '../../../app/ui-utils/client';
import { KonchatNotification } from '../../../app/ui/client/lib/KonchatNotification';
import { getUserPreference } from '../../../app/utils/client';
import { RoomManager } from '../../lib/RoomManager';
import { fireGlobalEvent } from '../../lib/utils/fireGlobalEvent';
import { isLayoutEmbedded } from '../../lib/utils/isLayoutEmbedded';

const notifyNewRoom = async (sub: ISubscription): Promise<void> => {
	const user = Meteor.user() as IUser | null;
	if (!user || user.status === 'busy') {
		return;
	}

	if ((!FlowRouter.getParam('name') || FlowRouter.getParam('name') !== sub.name) && !sub.ls && sub.alert === true) {
		KonchatNotification.newRoom(sub.rid);
	}
};

function notifyNewMessageAudio(rid?: string): void {
	// This logic is duplicated in /client/startup/unread.coffee.
	const hasFocus = readMessage.isEnable();
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
	Tracker.autorun(() => {
		if (!Meteor.userId()) {
			return;
		}

		Notifications.onUser('notification', (notification) => {
			const openedRoomId = ['channel', 'group', 'direct'].includes(FlowRouter.getRouteName()) ? RoomManager.opened : undefined;

			// This logic is duplicated in /client/startup/unread.coffee.
			const hasFocus = readMessage.isEnable();
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

		Notifications.onUser('subscriptions-changed', (_, sub) => {
			void notifyNewRoom(sub);
		});
	});
});
