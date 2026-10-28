import type { BoxProps } from '@rocket.chat/fuselage';
import { Box } from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';

type WorkspaceCardSectionsProps = {
	gap: BoxProps['gap'];
	spaceAbove?: BoxProps['paddingBlockStart'];
	spaceBelow: BoxProps['paddingBlockEnd'];
	children: ReactNode;
};

/**
 * The sections of a workspace card's body, spaced apart and kept clear of the card's heading and controls.
 */
const WorkspaceCardSections = ({ gap, spaceAbove, spaceBelow, children }: WorkspaceCardSectionsProps) => (
	<Box display='flex' flexDirection='column' gap={gap} paddingBlockStart={spaceAbove} paddingBlockEnd={spaceBelow}>
		{children}
	</Box>
);

export default WorkspaceCardSections;
