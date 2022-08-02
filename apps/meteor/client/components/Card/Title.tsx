import { Box } from '@rocket.chat/fuselage';
import React, { FC } from 'react';

const Title: FC = ({ children, ...props }) => (
	<Box mb='x8' fontScale='p2m' {...props}>
		{children}
	</Box>
);

export default Title;
