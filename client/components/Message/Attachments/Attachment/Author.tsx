import { Box } from '@rocket.chat/fuselage';
import React, { ComponentProps, FC } from 'react';

const Author: FC<ComponentProps<typeof Box>> = (props) => (
	<Box display='flex' flexDirection='row' alignItems='center' mbe='x4' {...props} />
);

export default Author;
