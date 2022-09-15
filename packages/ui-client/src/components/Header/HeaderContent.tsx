import { Box } from '@rocket.chat/fuselage';
import type { FC, ComponentProps } from 'react';
import React from 'react';

const HeaderContent: FC<ComponentProps<typeof Box>> = (props) => (
	<Box flexGrow={1} width={1} flexShrink={1} mi='x4' display='flex' justifyContent='center' flexDirection='column' {...props} />
);

export default HeaderContent;
