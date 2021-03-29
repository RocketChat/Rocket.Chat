import { Box, BoxProps } from '@rocket.chat/fuselage';
import React, { FC } from 'react';

const Text: FC<BoxProps> = (props) => (
	<Box mbe='x4' mi='x2' fontScale='p1' color='default' {...props}></Box>
);

export default Text;
