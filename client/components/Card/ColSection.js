import { Box } from '@rocket.chat/fuselage';
import React from 'react';

const ColSection = ({ children }) => (
	<Box mb='x8' color='info'>
		{children}
	</Box>
);

export default ColSection;
