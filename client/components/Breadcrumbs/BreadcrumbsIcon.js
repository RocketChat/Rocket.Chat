import { Box, Icon } from '@rocket.chat/fuselage';
import React from 'react';

const BreadcrumbsIcon = ({ name, color, children }) => (
	<Box w='x20' mi='x2' display='inline-flex' justifyContent='center' color={color}>
		{name ? <Icon size='x20' name={name} /> : children}
	</Box>
);

export default BreadcrumbsIcon;
