import { Box } from '@rocket.chat/fuselage';
import type { FC } from 'react';
import React from 'react';

const Sidebar: FC = ({ children, ...props }) => (
	<Box
		backgroundColor='surface-light'
		borderColor='stroke-extra-light'
		borderInlineEndWidth='1px'
		borderStyle='solid'
		display='flex'
		flexDirection='column'
		h='full'
		justifyContent='stretch'
		{...props}
		role='navigation'
	>
		{children}
	</Box>
);

export default Sidebar;
