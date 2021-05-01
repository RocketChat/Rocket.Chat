import { Box, Icon } from '@rocket.chat/fuselage';
import React, { FC } from 'react';

const CardIcon: FC<{ name: string }> = ({ name, children, ...props }) => (
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
