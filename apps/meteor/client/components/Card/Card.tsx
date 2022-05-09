import { Box } from '@rocket.chat/fuselage';
import React, { ReactElement, ComponentProps, ReactNode } from 'react';

type CardProps = ComponentProps<typeof Box> & {
	children: ReactNode;
};

const Card = ({ children, ...props }: CardProps): ReactElement => (
	<Box display='flex' flexDirection='column' pi='x16' pb='x8' backgroundColor='neutral-100' width='fit-content' {...props}>
		{children}
	</Box>
);

export default Card;
