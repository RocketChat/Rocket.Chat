import { Box } from '@rocket.chat/fuselage';
import type { ComponentProps, FC } from 'react';

const CardColTitle: FC<ComponentProps<typeof Box>> = ({ children, ...props }) => (
	<Box m='none' fontScale='c2' {...props}>
		{children}
	</Box>
);

export default CardColTitle;
