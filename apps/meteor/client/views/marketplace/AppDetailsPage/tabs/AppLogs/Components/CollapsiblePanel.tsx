import { Box } from '@rocket.chat/fuselage';
import type { ComponentProps } from 'react';

type CollapsiblePanelProps = ComponentProps<typeof Box>;

export const CollapsiblePanel = (props: CollapsiblePanelProps) => {
	return (
		<Box {...props} is='dl'>
			{props.children}
		</Box>
	);
};
