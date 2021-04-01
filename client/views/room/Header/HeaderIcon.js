import { Box, Icon } from '@rocket.chat/fuselage';
import React from 'react';

import { useRoomIcon } from '../../../hooks/useRoomIcon';

const HeaderIcon = ({ room }) => {
	const icon = useRoomIcon(room);

	return (
		<Box w='x20' mi='x2' display='inline-flex' justifyContent='center'>
			{icon.name ? <Icon size='x20' {...icon} /> : icon}
		</Box>
	);
};

export default HeaderIcon;
