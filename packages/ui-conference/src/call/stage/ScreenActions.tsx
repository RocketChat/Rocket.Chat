import { Box, ButtonGroup } from '@rocket.chat/fuselage';
import type { ComponentProps, ReactNode } from 'react';

export type ScreenActionsProps = Pick<ComponentProps<typeof Box>, 'className'> & {
	/** Closer to the corner, for a thumbnail. */
	compact?: boolean;
	children: ReactNode;
};

/** The controls in the top corner of a shared screen. */
const ScreenActions = ({ compact = false, className, children }: ScreenActionsProps) => (
	<Box className={className} position='absolute' insetBlockStart={compact ? 'x4' : 'x8'} insetInlineEnd={compact ? 'x4' : 'x8'} zIndex={1}>
		<ButtonGroup small>{children}</ButtonGroup>
	</Box>
);

export default ScreenActions;
