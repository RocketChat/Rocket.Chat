import { Box } from '@rocket.chat/fuselage';
import React, { FC, ComponentProps } from 'react';

const Details: FC<ComponentProps<typeof Box>> = ({ ...props }) => (
	<Box rcx-attachment__details fontScale='p2' color='info' bg='neutral-100' pi='x16' pb='x16' {...props} />
);

export default Details;
