import { Box } from '@rocket.chat/fuselage';
import React, { FC } from 'react';

const Col: FC = ({ children }) => (
	<Box display='flex' alignSelf='stretch' w='x228' flexDirection='column' fontScale='c1'>
		{children}
	</Box>
);

export default Col;
