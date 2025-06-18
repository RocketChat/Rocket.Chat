import type { IRoom } from '@rocket.chat/core-typings';
import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import { useEndpoint, useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import { useTranslation } from 'react-i18next';

type useToggleNotificationActionProps = {
	rid: IRoom['_id'];
	isNotificationEnabled: boolean;
	roomName: string;
};

export const useToggleNotificationAction = ({ rid, isNotificationEnabled, roomName }: useToggleNotificationActionProps) => {
	const toggleNotification = useEndpoint('POST', '/v1/rooms.saveNotification');
	const dispatchToastMessage = useToastMessageDispatch();
	const { t } = useTranslation();

	const handleToggleNotification = useEffectEvent(async () => {
		try {
			await toggleNotification({ roomId: rid, notifications: { disableNotifications: isNotificationEnabled ? '1' : '0' } });
			dispatchToastMessage({
				type: 'success',
				message: t(isNotificationEnabled ? 'Room_notifications_off' : 'Room_notifications_on', { roomName }),
			});
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
		}
	});

	return handleToggleNotification;
};
