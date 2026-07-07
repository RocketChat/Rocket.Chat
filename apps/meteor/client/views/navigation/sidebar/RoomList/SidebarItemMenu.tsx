import type { SubscriptionWithRoom, LocationPathname } from '@rocket.chat/ui-contexts';
import { memo } from 'react';

import { useOpenedRoom } from '../../../../lib/RoomManager';
import { roomCoordinator } from '../../../../lib/rooms/roomCoordinator';
import { useRoomMenuActions } from '../../sidepanel/hooks/useRoomMenuActions';
import RoomMenuWithCategories from '../categories/RoomMenuWithCategories';

/** Kebab menu for a room row in the main sidebar: default room actions + a "Move to" category submenu. */
const SidebarItemMenu = ({ room }: { room: SubscriptionWithRoom }) => {
	const openedRoom = useOpenedRoom();

	const { rid, t: type, cl, f: isFavorite, unread, alert } = room;
	const title = roomCoordinator.getRoomName(room.t, room) || '';
	const href = (roomCoordinator.getRouteLink(room.t, room) || undefined) as LocationPathname | undefined;
	const isUnread = Boolean(alert || unread);

	const sections = useRoomMenuActions({
		rid,
		type,
		name: title,
		isUnread,
		cl,
		roomOpen: rid === openedRoom,
		hideDefaultOptions: false,
		href,
	});

	return <RoomMenuWithCategories sections={sections} room={{ rid, name: title, isFavorite }} />;
};

export default memo(SidebarItemMenu);
