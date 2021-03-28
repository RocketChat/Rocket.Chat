import { Box, Icon } from '@rocket.chat/fuselage';
import React from 'react';

const CardIcon = ({ name, children, ...props }) => (
	<Box
		minWidth='x16'
		display='inline-flex'
		flexDirection='row'
		alignItems='flex-end'
		justifyContent='center'
	>
		{children || <Icon size='x16' name={name} {...props} />}
	</Box>
);

export default CardIcon;
