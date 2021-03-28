import { Box } from '@rocket.chat/fuselage';
import React from 'react';

const Card = ({ children, ...props }) => (
	<Box
		display='flex'
		flexDirection='column'
		pi='x16'
		pb='x8'
		width='fit-content'
		bg='neutral-100'
		{...props}
	>
		{children}
	</Box>
);

export default Card;
