import { Box } from '@rocket.chat/fuselage';
import React, { ComponentProps, FC } from 'react';

const Text: FC<ComponentProps<typeof Box>> = (props) => (
	<Box mbe='x4' mi='x2' fontScale='p1' color='default' {...props}></Box>
);

export default Text;
