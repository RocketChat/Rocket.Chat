import { Box } from '@rocket.chat/fuselage';
import React, { FC, CSSProperties } from 'react';

type BodyProps = {
	flexDirection?: CSSProperties['flexDirection'];
};

const Body: FC<BodyProps> = ({ children, flexDirection = 'row' }) => (
	<Box mb='x8' display='flex' flexDirection={flexDirection} flexGrow={1}>
		{children}
	</Box>
);

export default Body;
