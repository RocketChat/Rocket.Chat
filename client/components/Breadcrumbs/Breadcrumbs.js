import { Box } from '@rocket.chat/fuselage';
import React from 'react';

const Breadcrumbs = ({ children }) => (
	<Box withTruncatedText mie='x2' display='flex' flexDirection='row' alignItems='center'>
		{children}
	</Box>
);

export default Breadcrumbs;
