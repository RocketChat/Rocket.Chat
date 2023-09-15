import { Box } from '@rocket.chat/fuselage';
import type { FC, ComponentProps } from 'react';

const CardBody: FC<ComponentProps<typeof Box>> = ({ children, flexDirection = 'row', height, ...props }) => (
	<Box mb={8} display='flex' flexDirection={flexDirection} flexGrow={1} height={height} {...props}>
		{children}
	</Box>
);

export default CardBody;
