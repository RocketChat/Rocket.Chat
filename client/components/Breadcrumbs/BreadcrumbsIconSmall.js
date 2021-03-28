import { Box, Icon } from '@rocket.chat/fuselage';
import React from 'react';

const BreadcrumbsIconSmall = ({ name, color, children }) => (
	<Box w='x12' display='inline-flex' justifyContent='center' color={color}>
		{name ? <Icon size='x12' name={name} /> : children}
	</Box>
);

export default BreadcrumbsIconSmall;
