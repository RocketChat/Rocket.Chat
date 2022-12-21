import { Box } from '@rocket.chat/fuselage';
import type { FC } from 'react';
import React from 'react';

const Sidebar: FC = ({ children, ...props }) => (
	<Box display='flex' flexDirection='column' h='full' justifyContent='stretch' {...props}>
		{children}
	</Box>
);

export default Sidebar;
