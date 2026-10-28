import { Box } from '@rocket.chat/fuselage';
import type { ComponentProps } from 'react';

export type CollapsiblePanelProps = ComponentProps<typeof Box>;

/**
 * A list of entries that each expand to reveal their details, as a description list.
 */
export const CollapsiblePanel = (props: CollapsiblePanelProps) => {
	return (
		<Box {...props} is='dl'>
			{props.children}
		</Box>
	);
};
