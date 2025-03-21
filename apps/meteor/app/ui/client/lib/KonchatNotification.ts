import type { INotificationDesktop } from '@rocket.chat/core-typings';
import { Random } from '@rocket.chat/random';
import { Meteor } from 'meteor/meteor';
import { ReactiveVar } from 'meteor/reactive-var';

import { onClientMessageReceived } from '../../../../client/lib/onClientMessageReceived';
import { router } from '../../../../client/providers/RouterProvider';
import { stripTags } from '../../../../lib/utils/stringUtils';
import { getUserPreference } from '../../../utils/client';
import { getUserAvatarURL } from '../../../utils/client/getUserAvatarURL';
import { sdk } from '../../../utils/client/lib/SDKClient';

declare global {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface NotificationEventMap {
		reply: { response: string };
	}
}

class KonchatNotification {
	public notificationStatus = new ReactiveVar<NotificationPermission | undefined>(undefined);

	public getDesktopPermission() {
		if (window.Notification && Notification.permission !== 'granted') {
			return Notification.requestPermission((status) => {
				this.notificationStatus.set(status);
			});
		}
	}

	public async notify(notification: INotificationDesktop) {
		if (typeof window.Notification === 'undefined' || Notification.permission !== 'granted') {
			return;
		}

		if (!notification.payload) {
			return;
		}

		const { rid } = notification.payload;

		if (!rid) {
			return;
		}
		const message = await onClientMessageReceived({
			rid,
			msg: notification.text,
			notification: true,
		} as any);

		const requireInteraction = getUserPreference<boolean>(Meteor.userId(), 'desktopNotificationRequireInteraction');
		const n = new Notification(notification.title, {
			icon: notification.icon || getUserAvatarURL(notification.payload.sender?.username as string),
			body: stripTags(message.msg),
			tag: notification.payload._id,
			canReply: true,
			silent: true,
			requireInteraction,
		} as NotificationOptions & {
			canReply?: boolean; // TODO is this still needed for the desktop app?
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
		}

		n.onclick = function () {
			this.close();
			window.focus();

			if (!notification.payload._id || !notification.payload.rid || !notification.payload.name) {
				return;
			}

			switch (notification.payload?.type) {
				case 'd':
					return router.navigate({
						pattern: '/direct/:rid/:tab?/:context?',
						params: {
							rid: notification.payload.rid,
							...(notification.payload.tmid && {
								tab: 'thread',
								context: notification.payload.tmid,
							}),
						},
						search: { ...router.getSearchParameters(), jump: notification.payload._id },
					});
				case 'c':
					return router.navigate({
						pattern: '/channel/:name/:tab?/:context?',
						params: {
							name: notification.payload.name,
							...(notification.payload.tmid && {
								tab: 'thread',
								context: notification.payload.tmid,
							}),
						},
						search: { ...router.getSearchParameters(), jump: notification.payload._id },
					});
				case 'p':
					return router.navigate({
						pattern: '/group/:name/:tab?/:context?',
						params: {
							name: notification.payload.name,
							...(notification.payload.tmid && {
								tab: 'thread',
								context: notification.payload.tmid,
							}),
						},
						search: { ...router.getSearchParameters(), jump: notification.payload._id },
					});
				case 'l':
					return router.navigate({
						pattern: '/live/:id/:tab?/:context?',
						params: {
							id: notification.payload.rid,
							tab: 'room-info',
						},
						search: { ...router.getSearchParameters(), jump: notification.payload._id },
					});
			}
		};
	}
}

const instance = new KonchatNotification();

export { instance as KonchatNotification };
