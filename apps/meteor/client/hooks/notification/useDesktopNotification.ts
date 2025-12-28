import type { INotificationDesktop } from '@rocket.chat/core-typings';
import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import { useUser } from '@rocket.chat/ui-contexts';

import { useNotification } from './useNotification';
import { RoomManager } from '../../lib/RoomManager';
import { e2e } from '../../lib/e2ee';
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

		const { message } = notification.payload;

		if (message.t === 'e2e' && message.content) {
			const e2eRoom = await e2e.getInstanceByRoomId(notification.payload.rid);
			if (e2eRoom) {
				const decrypted = await e2eRoom.decrypt(message.content);
				// TODO(@cardoso): review backward compatibility
				notification.text = decrypted.msg ?? '';
			}
		}

		return getAvatarAsPng(notification.payload.sender?.username, (avatarAsPng) => {
			notification.icon = avatarAsPng;
			return notify(notification);
		});
	});

	return notifyDesktop;
};
