import { Box } from '@rocket.chat/fuselage';
import React, { FC } from 'react';

const InfoPanel: FC = ({ children }) => (
	<Box flexGrow={1} mb='neg-x24'>
		{children}
	</Box>
);

export default InfoPanel;
