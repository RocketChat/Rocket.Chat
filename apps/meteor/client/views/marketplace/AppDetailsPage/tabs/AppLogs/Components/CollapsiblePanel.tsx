import type { BoxProps } from '@rocket.chat/fuselage';
import { Box } from '@rocket.chat/fuselage';

export type CollapsiblePanelProps = BoxProps;

export const CollapsiblePanel = (props: CollapsiblePanelProps) => {
	return (
		<Box {...props} is='dl'>
			{props.children}
		</Box>
	);
};
