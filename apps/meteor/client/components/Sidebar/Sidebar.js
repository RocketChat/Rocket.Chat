import { Box } from '@rocket.chat/fuselage';
import React from 'react';

const Sidebar = ({ children, ...props }) => (
	<Box display='flex' flexDirection='column' h='full' justifyContent='stretch' {...props}>
		{children}
	</Box>
);

export default Sidebar;
