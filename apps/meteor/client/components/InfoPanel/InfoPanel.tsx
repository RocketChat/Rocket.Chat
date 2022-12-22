import { Box } from '@rocket.chat/fuselage';
import type { FC } from 'react';
import React from 'react';

const InfoPanel: FC = ({ children }) => (
	<Box flexGrow={1} mb='neg-x24'>
		{children}
	</Box>
);

export default InfoPanel;
