import type { INotificationDesktop } from '@rocket.chat/core-typings';
import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import { useUser } from '@rocket.chat/ui-contexts';

import { useNotification } from './useNotification';
import { RoomManager } from '../../lib/RoomManager';
import { decryptNotification } from '../../lib/e2ee';
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

		await decryptNotification(notification.payload);

		return getAvatarAsPng(notification.payload.sender?.username, (avatarAsPng) => {
			notification.icon = avatarAsPng;
			return notify(notification);
		});
	});

	return notifyDesktop;
};
