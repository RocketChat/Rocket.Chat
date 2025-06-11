import type { IRoom } from '@rocket.chat/core-typings';
import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import { useEndpoint, useToastMessageDispatch } from '@rocket.chat/ui-contexts';

export const useToggleNotificationAction = ({ rid, isNotificationEnabled }: { rid: IRoom['_id']; isNotificationEnabled: boolean }) => {
	const toggleNotification = useEndpoint('POST', '/v1/rooms.saveNotification');
	const dispatchToastMessage = useToastMessageDispatch();

	const handleToggleNotification = useEffectEvent(async () => {
		try {
			await toggleNotification({ roomId: rid, notifications: { disableNotifications: isNotificationEnabled ? '0' : '1' } });
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
		}
	});

	return handleToggleNotification;
};
