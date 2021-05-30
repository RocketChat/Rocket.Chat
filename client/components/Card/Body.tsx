import { Box } from '@rocket.chat/fuselage';
import React, { FC, CSSProperties } from 'react';

const Body: FC<{ flexDirection: CSSProperties['flexDirection'] }> = ({
	children,
	flexDirection = 'row',
}) => (
	<Box mb='x8' display='flex' flexDirection={flexDirection} flexGrow={1}>
		{children}
	</Box>
);

export default Body;
