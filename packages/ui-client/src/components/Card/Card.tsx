import { Box } from '@rocket.chat/fuselage';
import type { ComponentProps, FC } from 'react';

const Card: FC<ComponentProps<typeof Box>> = ({ children, ...props }) => (
	<Box borderRadius='x8' p={20} height='full' display='flex' flexDirection='column' bg='light' color='default' {...props}>
		{children}
	</Box>
);

export default Card;
