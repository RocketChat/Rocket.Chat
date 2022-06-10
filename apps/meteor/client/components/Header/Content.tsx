import { Box } from '@rocket.chat/fuselage';
import React, { FC } from 'react';

const Content: FC<any> = (props) => (
	<Box flexGrow={1} width={1} flexShrink={1} mi='x4' display='flex' justifyContent='center' flexDirection='column' {...props} />
);

export default Content;
