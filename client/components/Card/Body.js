import { Box } from '@rocket.chat/fuselage';
import React from 'react';

const Body = ({ children, flexDirection = 'row' }) => (
	<Box mb='x8' display='flex' flexDirection={flexDirection} flexGrow={1}>
		{children}
	</Box>
);

export default Body;
