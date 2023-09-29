import { Box } from '@rocket.chat/fuselage';
import type { ComponentProps, FC } from 'react';

const CardTitle: FC<ComponentProps<typeof Box>> = ({ children, ...props }) => (
	<Box mbe={12} fontScale='h4' color='default' {...props}>
		{children}
	</Box>
);

export default CardTitle;
