import { Sidebar } from '@rocket.chat/fuselage';
import React from 'react';

import { useRoomIcon } from '../../hooks/useRoomIcon';

const SidebarIcon = ({ room, small }) => {
	const icon = useRoomIcon(room, small);
	const unread = !room.hideUnreadStatus && (room.alert || room.unread);

	return (
		<Sidebar.Item.Icon
			className={unread && 'rcx-sidebar-item--highlighted'}
			{...(icon.name && icon)}
		>
			{!icon.name && icon}
		</Sidebar.Item.Icon>
	);
};

export default SidebarIcon;
