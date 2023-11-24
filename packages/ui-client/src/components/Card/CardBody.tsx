import { Box } from '@rocket.chat/fuselage';
import type { FC, CSSProperties, ComponentProps } from 'react';

type CardBodyProps = {
	flexDirection?: CSSProperties['flexDirection'];
	minHeight?: ComponentProps<typeof Box>['minHeight'];
	height?: ComponentProps<typeof Box>['height'];
};

const CardBody: FC<CardBodyProps> = ({ children, flexDirection = 'row', ...props }) => (
	<Box mb={8} display='flex' flexDirection={flexDirection} flexGrow={1} {...props}>
		{children}
	</Box>
);

export default CardBody;
