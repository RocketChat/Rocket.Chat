import { Box } from '@rocket.chat/fuselage';
import type { FC, ComponentProps } from 'react';
import React from 'react';

const HeaderContentRow: FC<ComponentProps<typeof Box>> = (props) => (
	<Box alignItems='center' flexShrink={1} flexGrow={1} display='flex' {...props} />
);

export default HeaderContentRow;
