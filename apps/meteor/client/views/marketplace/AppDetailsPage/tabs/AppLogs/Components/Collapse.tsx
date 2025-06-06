import { Box } from '@rocket.chat/fuselage';
import type { ComponentProps } from 'react';

export const Collapse = (props: ComponentProps<typeof Box>) => {
	return (
		<Box {...props} is='dl'>
			{props.children}
		</Box>
	);
};
