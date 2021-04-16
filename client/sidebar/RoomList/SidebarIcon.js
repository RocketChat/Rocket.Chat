import { Sidebar } from '@rocket.chat/fuselage';
import React from 'react';

import { useRoomIcon } from '../../hooks/useRoomIcon';

const SidebarIcon = ({ room, small }) => {
	const icon = useRoomIcon(room, small);

	return <Sidebar.Item.Icon {...(icon.name && icon)}>{!icon.name && icon}</Sidebar.Item.Icon>;
};

export default SidebarIcon;
