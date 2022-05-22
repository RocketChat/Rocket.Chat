import { Box } from '@rocket.chat/fuselage';
import React, { FC, CSSProperties, ComponentProps } from 'react';

type BodyProps = {
	flexDirection?: CSSProperties['flexDirection'];
	height?: ComponentProps<typeof Box>['height'];
};

const Body: FC<BodyProps> = ({ children, flexDirection = 'row', height }) => (
	<Box mb='x8' display='flex' flexDirection={flexDirection} flexGrow={1} height={height}>
		{children}
	</Box>
);

export default Body;
