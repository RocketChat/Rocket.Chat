import type { AtLeast, ISubscription } from '@rocket.chat/core-typings';
import { useRouter, useStream, useUser, useUserPreference } from '@rocket.chat/ui-contexts';
import { useCallback, useEffect } from 'react';

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

	const notifyNewRoom = useCallback(
		async (sub: AtLeast<ISubscription, 'rid'>): Promise<void> => {
			if (!user || user.status === 'busy') {
				return;
			}

			if ((!router.getRouteParameters().name || router.getRouteParameters().name !== sub.name) && !sub.ls && sub.alert === true) {
				KonchatNotification.newRoom(sub.rid);
			}
		},
		[router, user],
	);

	const notifyNewMessageAudio = useCallback(
		(rid?: string) => {
			const hasFocus = document.hasFocus();
			const messageIsInOpenedRoom = RoomManager.opened === rid;

			if (isLayoutEmbedded) {
				if (!hasFocus && messageIsInOpenedRoom) {
					// Play a notification sound
					void KonchatNotification.newMessage(rid);
				}
			} else if (!hasFocus || !messageIsInOpenedRoom || !muteFocusedConversations) {
				// Play a notification sound
				void KonchatNotification.newMessage(rid);
			}
		},
		[isLayoutEmbedded, muteFocusedConversations],
	);

	useEffect(() => {
		if (!user?._id) {
			return;
		}

		notifyUserStream(`${user?._id}/notification`, (notification) => {
			const openedRoomId = ['channel', 'group', 'direct'].includes(router.getRouteName() || '') ? RoomManager.opened : undefined;

			const hasFocus = document.hasFocus();
			const messageIsInOpenedRoom = openedRoomId === notification.payload.rid;

			fireGlobalEvent('notification', {
				notification,
				fromOpenedRoom: messageIsInOpenedRoom,
				hasFocus,
			});

			if (isLayoutEmbedded) {
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

		notifyUserStream(`${user?._id}/subscriptions-changed`, (action, sub) => {
			if (action === 'removed') {
				return;
			}

			void notifyNewRoom(sub);
		});

		CachedChatSubscription.collection.find().observe({
			changed: (sub) => {
				void notifyNewRoom(sub);
			},
		});
	}, [isLayoutEmbedded, notifyNewMessageAudio, notifyNewRoom, notifyUserStream, router, user?._id]);
};
