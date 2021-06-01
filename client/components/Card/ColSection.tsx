import { Box } from '@rocket.chat/fuselage';
import React, { FC } from 'react';

const ColSection: FC = ({ children, ...props }) => (
	<Box mb='x8' color='info' {...props}>
		{children}
	</Box>
);

export default ColSection;
