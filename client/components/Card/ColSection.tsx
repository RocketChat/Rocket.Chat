import { Box } from '@rocket.chat/fuselage';
import React, { FC } from 'react';

const ColSection: FC = ({ children }) => (
	<Box mb='x8' color='info'>
		{children}
	</Box>
);

export default ColSection;
