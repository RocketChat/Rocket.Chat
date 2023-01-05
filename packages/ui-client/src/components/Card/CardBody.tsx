import { Box } from '@rocket.chat/fuselage';
import type { FC, CSSProperties, ComponentProps } from 'react';

type CardBodyProps = {
	flexDirection?: CSSProperties['flexDirection'];
	height?: ComponentProps<typeof Box>['height'];
};

const CardBody: FC<CardBodyProps> = ({ children, flexDirection = 'row', height }) => (
	<Box mb='x8' display='flex' flexDirection={flexDirection} flexGrow={1} height={height} color='info'>
		{children}
	</Box>
);

export default CardBody;
