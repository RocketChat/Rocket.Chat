import { Box } from '@rocket.chat/fuselage';
import React, { FC } from 'react';

const Title: FC = ({ children }) => (
	<Box mb='x8' fontScale='p2m'>
		{children}
	</Box>
);

export default Title;
