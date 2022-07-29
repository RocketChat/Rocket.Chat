import { Box } from '@rocket.chat/fuselage';
import React, { FC } from 'react';

const ColTitle: FC = ({ children }) => (
	<Box fontScale='c2' m='none'>
		{children}
	</Box>
);

export default ColTitle;
