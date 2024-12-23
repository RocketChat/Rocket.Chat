import type { AtLeast, INotificationDesktop, ISubscription } from '@rocket.chat/core-typings';
import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import { useRouter, useStream, useUser, useUserPreference } from '@rocket.chat/ui-contexts';
import { useEffect } from 'react';

import { useEmbeddedLayout } from './useEmbeddedLayout';
import { CachedChatSubscription } from '../../app/models/client';
import { KonchatNotification } from '../../app/ui/client/lib/KonchatNotification';
import { RoomManager } from '../lib/RoomManager';
import { fireGlobalEvent } from '../lib/utils/fireGlobalEvent';

export const useNotifyUser = () => {
	const user = useUser();
	const router = useRouter();
	const isLayoutEmbedded = useEmbeddedLayout();
	const notifyUserStream = useStream('notify-user');
	const muteFocusedConversations = useUserPreference('muteFocusedConversations');

	const notifyNewRoom = useEffectEvent(async (sub: AtLeast<ISubscription, 'rid'>): Promise<void> => {
		if (!user || user.status === 'busy') {
			return;
		}

		if ((!router.getRouteParameters().name || router.getRouteParameters().name !== sub.name) && !sub.ls && sub.alert === true) {
			KonchatNotification.newRoom();
		}
	});

	const notifyNewMessageAudioAndDesktop = useEffectEvent((notification: INotificationDesktop) => {
		const hasFocus = document.hasFocus();

		const openedRoomId = ['channel', 'group', 'direct'].includes(router.getRouteName() || '') ? RoomManager.opened : undefined;

		const { rid } = notification.payload;
		const messageIsInOpenedRoom = openedRoomId === rid;

		fireGlobalEvent('notification', {
			notification,
			fromOpenedRoom: messageIsInOpenedRoom,
			hasFocus,
		});

		if (isLayoutEmbedded) {
			if (!hasFocus && messageIsInOpenedRoom) {
				// Play a notification sound
				void KonchatNotification.newMessage(rid);
				void KonchatNotification.showDesktop(notification);
			}
		} else if (!hasFocus || !messageIsInOpenedRoom || !muteFocusedConversations) {
			// Play a notification sound
			void KonchatNotification.newMessage(rid);
			void KonchatNotification.showDesktop(notification);
		}
	});

	useEffect(() => {
		if (!user?._id) {
			return;
		}

		const unsubNotification = notifyUserStream(`${user._id}/notification`, notifyNewMessageAudioAndDesktop);

		const unsubSubs = notifyUserStream(`${user._id}/subscriptions-changed`, (action, sub) => {
			if (action !== 'inserted') {
				return;
			}

			void notifyNewRoom(sub);
		});

		const handle = CachedChatSubscription.collection.find().observe({
			added: (sub) => {
				void notifyNewRoom(sub);
			},
		});

		return () => {
			unsubNotification();
			unsubSubs();
			handle.stop();
		};
	}, [isLayoutEmbedded, notifyNewMessageAudioAndDesktop, notifyNewRoom, notifyUserStream, router, user?._id]);
};
