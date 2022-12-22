import { Box } from '@rocket.chat/fuselage';
import type { FC } from 'react';
import React from 'react';

const CardHeader: FC = ({ children }) => (
	<Box display='flex' flexDirection='row' color='default' justifyContent='space-between'>
		{children}
	</Box>
);

export default CardHeader;
