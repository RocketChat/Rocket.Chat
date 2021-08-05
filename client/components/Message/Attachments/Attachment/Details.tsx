import { Box } from '@rocket.chat/fuselage';
import React, { FC, ComponentProps } from 'react';

const Details: FC<ComponentProps<typeof Box>> = ({ ...props }) => (
	<Box
		rcx-attachment__details
		fontScale='p1'
		color='info'
		bg='neutral-100'
		pi='x4'
		pb='x4'
		{...props}
	/>
);

export default Details;
