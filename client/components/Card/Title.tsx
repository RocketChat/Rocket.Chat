import { Box } from '@rocket.chat/fuselage';
import React, { FC } from 'react';

const Title: FC = ({ children }) => (
	<Box mb='x8' fontScale='p4'>
		{children}
	</Box>
);

export default Title;
