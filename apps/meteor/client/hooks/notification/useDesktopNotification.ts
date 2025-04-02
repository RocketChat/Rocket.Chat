import type { INotificationDesktop } from '@rocket.chat/core-typings';
import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import { useUser } from '@rocket.chat/ui-contexts';

import { useNotification } from './useNotification';
import { e2e } from '../../../app/e2e/client';
import { RoomManager } from '../../lib/RoomManager';
import { getAvatarAsPng } from '../../lib/utils/getAvatarAsPng';

export const useDesktopNotification = () => {
	const user = useUser();
	const notify = useNotification();

	const notifyDesktop = useEffectEvent(async (notification: INotificationDesktop) => {
		if (
			notification.payload.rid === RoomManager.opened &&
			(typeof window.document.hasFocus === 'function' ? window.document.hasFocus() : undefined)
		) {
			return;
		}
		if (user?.status === 'busy') {
			return;
		}

		if (notification.payload.message?.t === 'e2e') {
			const e2eRoom = await e2e.getInstanceByRoomId(notification.payload.rid);
			if (e2eRoom) {
				notification.text = (await e2eRoom.decrypt(notification.payload.message.msg)).text;
			}
		}

		return getAvatarAsPng(notification.payload.sender?.username, (avatarAsPng) => {
			notification.icon = avatarAsPng;
			return notify(notification);
		});
	});

	return notifyDesktop;
};
