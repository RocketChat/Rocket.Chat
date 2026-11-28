import type { INotificationDesktop } from '@rocket.chat/core-typings';
import { useStableCallback } from '@rocket.chat/fuselage-hooks';
import { Random } from '@rocket.chat/random';
import { useRouter, useUserPreference } from '@rocket.chat/ui-contexts';
import { useVideoConfJoinCall } from '@rocket.chat/ui-video-conf';

import { useNotificationAllowed } from './useNotificationAllowed';
import { stripTags } from '../../../lib/utils/stringUtils';
import { sdk } from '../../lib/SDKClient';
import { getUserAvatarURL } from '../../lib/getUserAvatarURL';
import { onClientMessageReceived } from '../../lib/onClientMessageReceived';
import { isSeenLater, openNotifications } from '../../lib/openNotifications';
import { Subscriptions } from '../../stores';

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

		const { rid, tmid, name: roomName, _id: msgId, conferenceId } = notification.payload;
		if (!rid) {
			return;
		}

		const findSubscription = () => Subscriptions.state.find((record) => record.rid === rid);
		const subscription = findSubscription();
		const { ls, tunread } = subscription ?? {};
		const session = openNotifications.currentSession;

		const message = await onClientMessageReceived({
			rid,
			msg: notification.text,
			notification: true,
		} as any);

		if (session !== openNotifications.currentSession) {
			return;
		}

		// A notification may demand interaction on its own — a conference ring outlives the
		// recipient's preference, per INotificationDesktop.requireInteraction.
		const requireInteraction = requireInteractionPreference || notification.requireInteraction;

		// The room was read or left while the message was being prepared, so there is nothing left to notify.
		const current = findSubscription();
		if (!conferenceId && subscription && (!current || (isSeenLater(current.ls, ls) && !(tmid && current.tunread?.includes(tmid))))) {
			return;
		}

		const n = new Notification(notification.title, {
			icon: notification.icon || getUserAvatarURL(notification.payload.sender?.username),
			body: stripTags(message?.msg),
			tag: msgId,
			canReply: true,
			silent: true,
			requireInteraction,
			...(window.RocketChatDesktop && notification.actions?.length ? { actions: notification.actions } : {}),
		} as NotificationOptions & {
			canReply?: boolean;
		});

		if (!conferenceId) {
			openNotifications.track(n, { rid, tmid, ls, tunread });
		}

		const notificationDuration = !requireInteraction && notification.duration ? notification.duration - 0 : 0;
		if (notificationDuration > 0) {
			setTimeout(() => n.close(), notificationDuration * 1000);
		}

		if (n.addEventListener) {
			n.addEventListener(
				'reply',
				({ response }) =>
					void sdk.rest.post('/v1/chat.sendMessage', {
						message: {
							_id: Random.id(),
							rid,
							msg: response,
							...(tmid && { tmid }),
						},
					}),
			);

			// "Join" action (desktop app): join the call the same way the ongoing-call banner does. The event fires
			// for whichever button was pressed, so it has to say which — the server names this one `join`
			// (`video-conference/service.ts`), and a second action added later must not silently join a call.
			if (conferenceId) {
				n.addEventListener('action', (event) => {
					if (event.action !== 'join') {
						return;
					}

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
