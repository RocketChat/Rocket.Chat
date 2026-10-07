import type { IMessage, ISubscription } from '@rocket.chat/core-typings';
import { useStableCallback } from '@rocket.chat/fuselage-hooks';
import { useEndpoint, useToastMessageDispatch } from '@rocket.chat/ui-contexts';

import { useToggleNotificationAction } from '../../hooks/menuActions/useToggleNotificationsAction';
import { roomCoordinator } from '../../lib/rooms/roomCoordinator';

type RoomHoverCardActionsProps = {
	subscription: ISubscription;
	roomName: string;
	onClose: () => void;
};

export const useRoomHoverCardActions = ({ subscription, roomName, onClose }: RoomHoverCardActionsProps) => {
	const { rid, t: type, name } = subscription;

	const dispatchToastMessage = useToastMessageDispatch();
	const readMessages = useEndpoint('POST', '/v1/subscriptions.read');

	const toggleNotifications = useToggleNotificationAction({ rid, isNotificationEnabled: !subscription.disableNotifications, roomName });

	const openRoom = useStableCallback(() => {
		onClose();
		roomCoordinator.openRouteLink(type, { rid, name });
	});

	const openThread = useStableCallback((tmid: IMessage['_id']) => {
		onClose();
		roomCoordinator.openRouteLink(type, { rid, name }, undefined, { routeParamsOverrides: { tab: 'thread', context: tmid } });
	});

	const openThreads = useStableCallback(() => {
		onClose();
		roomCoordinator.openRouteLink(type, { rid, name }, undefined, { routeParamsOverrides: { tab: 'thread' } });
	});

	const markAsRead = useStableCallback(async () => {
		try {
			await readMessages({ rid, readThreads: true });
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
		}
	});

	return { openRoom, openThread, openThreads, markAsRead, toggleNotifications };
};
