import { Box } from '@rocket.chat/fuselage';
import React, { FC, ComponentProps } from 'react';

const Row: FC<ComponentProps<typeof Box>> = (props) => (
	<Box mi='neg-x2' mbe='x2' rcx-message-attachment display='flex' alignItems='center' {...props} />
);

export default Row;
