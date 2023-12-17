import type { INotificationDesktop, IRoom, IUser } from '@rocket.chat/core-typings';
import { Random } from '@rocket.chat/random';
import { Meteor } from 'meteor/meteor';
import { ReactiveVar } from 'meteor/reactive-var';

import { RoomManager } from '../../../../client/lib/RoomManager';
import { onClientMessageReceived } from '../../../../client/lib/onClientMessageReceived';
import { getAvatarAsPng } from '../../../../client/lib/utils/getAvatarAsPng';
import { router } from '../../../../client/providers/RouterProvider';
import { stripTags } from '../../../../lib/utils/stringUtils';
import { CustomSounds } from '../../../custom-sounds/client/lib/CustomSounds';
import { e2e } from '../../../e2e/client';
import { ChatSubscription } from '../../../models/client';
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

	public async showDesktop(notification: INotificationDesktop) {
		if (!notification.payload.rid) {
			return;
		}

		if (
			notification.payload?.rid === RoomManager.opened &&
			(typeof window.document.hasFocus === 'function' ? window.document.hasFocus() : undefined)
		) {
			return;
		}

		if ((Meteor.user() as IUser | null)?.status === 'busy') {
			return;
		}

		if (notification.payload?.message?.t === 'e2e') {
			const e2eRoom = await e2e.getInstanceByRoomId(notification.payload.rid);
			if (e2eRoom) {
				notification.text = (await e2eRoom.decrypt(notification.payload.message.msg)).text;
			}
		}

		return getAvatarAsPng(notification.payload?.sender?.username, (avatarAsPng) => {
			notification.icon = avatarAsPng;
			return this.notify(notification);
		});
	}

	public async newMessage(rid: IRoom['_id'] | undefined) {
		if ((Meteor.user() as IUser | null)?.status === 'busy') {
			return;
		}

		const userId = Meteor.userId();
		const newMessageNotification = getUserPreference<string>(userId, 'newMessageNotification');
		const audioVolume = getUserPreference(userId, 'notificationsSoundVolume', 100);

		if (!rid) {
			return;
		}

		const sub = ChatSubscription.findOne({ rid }, { fields: { audioNotificationValue: 1 } });

		if (!sub || sub.audioNotificationValue === 'none') {
			return;
		}

		try {
			if (sub.audioNotificationValue && sub.audioNotificationValue !== '0') {
				void CustomSounds.play(sub.audioNotificationValue, {
					volume: Number((audioVolume / 100).toPrecision(2)),
				});
				return;
			}

			if (newMessageNotification && newMessageNotification !== 'none') {
				void CustomSounds.play(newMessageNotification, {
					volume: Number((audioVolume / 100).toPrecision(2)),
				});
			}
		} catch (e) {
			// do nothing
		}
	}

	public newRoom(rid: IRoom['_id']) {
		Tracker.nonreactive(() => {
			let newRoomSound = Session.get('newRoomSound') as IRoom['_id'][] | undefined;
			if (newRoomSound) {
				newRoomSound = [...newRoomSound, rid];
			} else {
				newRoomSound = [rid];
			}

			return Session.set('newRoomSound', newRoomSound);
		});
	}

	public removeRoomNotification(rid: IRoom['_id']) {
		let newRoomSound = (Session.get('newRoomSound') as IRoom['_id'][] | undefined) ?? [];
		newRoomSound = newRoomSound.filter((_rid) => _rid !== rid);
		Tracker.nonreactive(() => Session.set('newRoomSound', newRoomSound));

		const link = document.querySelector(`.link-room-${rid}`);

		link?.classList.remove('new-room-highlight');
	}
}

const instance = new KonchatNotification();

export { instance as KonchatNotification };
