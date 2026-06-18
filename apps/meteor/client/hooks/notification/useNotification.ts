import type { INotificationDesktop } from '@rocket.chat/core-typings';
import { useStableCallback } from '@rocket.chat/fuselage-hooks';
import { Random } from '@rocket.chat/random';
import { useRouter, useUserPreference } from '@rocket.chat/ui-contexts';
import { useVideoConfJoinCall } from '@rocket.chat/ui-video-conf';

import { useNotificationAllowed } from './useNotificationAllowed';
import { getUserAvatarURL } from '../../../app/utils/client';
import { sdk } from '../../../app/utils/client/lib/SDKClient';
import { stripTags } from '../../../lib/utils/stringUtils';
import { onClientMessageReceived } from '../../lib/onClientMessageReceived';

export const useNotification = () => {
	const requireInteractionPreference = useUserPreference('desktopNotificationRequireInteraction');
	const router = useRouter();
	const joinCall = useVideoConfJoinCall();
	const notificationAllowed = useNotificationAllowed();

	const notify = useStableCallback(async (notification: INotificationDesktop) => {
		if (!notificationAllowed) {
			return;
		}
		if (!notification.payload) {
			return;
		}

		// A notification can opt into staying until interacted with, on top of the user preference.
		const requireInteraction = Boolean(notification.requireInteraction || requireInteractionPreference);

		const { rid, name: roomName, _id: msgId } = notification.payload;
		if (!rid) {
			return;
		}
		const message = await onClientMessageReceived({
			rid,
			msg: notification.text,
			notification: true,
		} as any);

		const n = new Notification(notification.title, {
			icon: notification.icon || getUserAvatarURL(notification.payload.sender?.username),
			body: stripTags(message?.msg),
			tag: msgId,
			canReply: true,
			silent: true,
			requireInteraction,
			...(notification.actions?.length ? { actions: notification.actions } : {}),
		} as NotificationOptions & {
			canReply?: boolean;
		});
		const notificationDuration = !requireInteraction ? (notification.duration ?? 0) - 0 || 10 : -1;
		if (notificationDuration > 0) {
			setTimeout(() => n.close(), notificationDuration * 1000);
		}

		if (n.addEventListener) {
			n.addEventListener(
				'reply',
				({ response }) =>
					void sdk.call('sendMessage', {
						_id: Random.id(),
						rid,
						msg: response,
					}),
			);

			// "Join" action (desktop app): join the call the same way the ongoing-call banner does.
			const { conferenceId } = notification.payload;
			if (conferenceId) {
				n.addEventListener('action', () => {
					n.close();
					window.focus();
					joinCall(conferenceId);
				});
			}
		}

		n.onclick = () => {
			n.close();
			window.focus();

			if (!msgId || !rid || !roomName) {
				return;
			}

			switch (notification.payload?.type) {
				case 'd':
					router.navigate({
						pattern: '/direct/:rid/:tab?/:context?',
						params: {
							rid,
							...(notification.payload.tmid && {
								tab: 'thread',
								context: notification.payload.tmid,
							}),
						},
						search: { ...router.getSearchParameters(), jump: msgId },
					});
					break;
				case 'c':
					return router.navigate({
						pattern: '/channel/:name/:tab?/:context?',
						params: {
							name: roomName,
							...(notification.payload.tmid && {
								tab: 'thread',
								context: notification.payload.tmid,
							}),
						},
						search: { ...router.getSearchParameters(), jump: msgId },
					});
				case 'p':
					return router.navigate({
						pattern: '/group/:name/:tab?/:context?',
						params: {
							name: roomName,
							...(notification.payload.tmid && {
								tab: 'thread',
								context: notification.payload.tmid,
							}),
						},
						search: { ...router.getSearchParameters(), jump: msgId },
					});
				case 'l':
					return router.navigate({
						pattern: '/live/:id/:tab?/:context?',
						params: {
							id: rid,
							tab: 'room-info',
						},
						search: { ...router.getSearchParameters(), jump: msgId },
					});
			}
		};
	});
	return notify;
};
