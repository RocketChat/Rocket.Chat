import type { AtLeast, INotificationDesktop, ISubscription, IUser } from '@rocket.chat/core-typings';
import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import { useCustomSound, useRouter, useStream, useUserPreference } from '@rocket.chat/ui-contexts';
import { useEffect } from 'react';

import { useEmbeddedLayout } from '../useEmbeddedLayout';
import { useDesktopNotification } from './useDesktopNotification';
import { useNewMessageNotification } from './useNewMessageNotification';
import { RoomManager } from '../../lib/RoomManager';
import { fireGlobalEvent } from '../../lib/utils/fireGlobalEvent';

export const useNotifyUser = (user: IUser) => {
	const router = useRouter();
	const isLayoutEmbedded = useEmbeddedLayout();
	const notifyUserStream = useStream('notify-user');
	const muteFocusedConversations = useUserPreference('muteFocusedConversations');
	const { notificationSounds } = useCustomSound();
	const newMessageNotification = useNewMessageNotification();
	const showDesktopNotification = useDesktopNotification();

	const notifyNewRoom = useEffectEvent(async (sub: AtLeast<ISubscription, 'rid'>): Promise<void> => {
		if (user.status === 'busy') {
			return;
		}

		if ((!router.getRouteParameters().name || router.getRouteParameters().name !== sub.name) && !sub.ls && sub.alert === true) {
			notificationSounds.playNewRoom();
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
				newMessageNotification(notification.payload);
				showDesktopNotification(notification);
			}
		} else if (!hasFocus || !messageIsInOpenedRoom || !muteFocusedConversations) {
			// Play a notification sound
			newMessageNotification(notification.payload);
			showDesktopNotification(notification);
		}
	});

	useEffect(() => {
		const unsubNotification = notifyUserStream(`${user._id}/notification`, notifyNewMessageAudioAndDesktop);

		const unsubSubs = notifyUserStream(`${user._id}/subscriptions-changed`, (action, sub) => {
			if (action !== 'inserted') {
				return;
			}

			void notifyNewRoom(sub);
		});

		return () => {
			unsubNotification();
			unsubSubs();
		};
	}, [notifyNewMessageAudioAndDesktop, notifyNewRoom, notifyUserStream, router, user._id]);

	useEffect(() => () => notificationSounds.stopNewRoom(), [notificationSounds]);
};
