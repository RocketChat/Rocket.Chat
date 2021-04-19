import { Box } from '@rocket.chat/fuselage';
import React from 'react';

const Col = ({ children }) => (
	<Box display='flex' alignSelf='stretch' w='x228' flexDirection='column' fontScale='c1'>
		{children}
	</Box>
);

export default Col;
