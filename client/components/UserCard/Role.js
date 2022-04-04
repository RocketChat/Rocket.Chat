import { Box, Tag } from '@rocket.chat/fuselage';
import React from 'react';

const Role = ({ children }) => (
	<Box m='x2' fontScale='c2'>
		<Tag disabled children={children} />
	</Box>
);

export default Role;
