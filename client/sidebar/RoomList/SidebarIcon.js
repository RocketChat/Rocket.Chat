import { Sidebar } from '@rocket.chat/fuselage';
import React from 'react';

import { useRoomIcon } from '../../hooks/useRoomIcon';

const SidebarIcon = ({ room }) => {
	const icon = useRoomIcon(room);

	return <Sidebar.Item.Icon {...(icon.name && icon)}>{!icon.name && icon}</Sidebar.Item.Icon>;
};

export default SidebarIcon;
