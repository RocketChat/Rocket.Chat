import { Box } from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';

type WorkspaceCardSectionsProps = {
	children: ReactNode;
};

/**
 * The titled sections of a card's body, spaced apart and kept clear of the card's controls.
 */
const WorkspaceCardSections = ({ children }: WorkspaceCardSectionsProps) => (
	<Box display='flex' flexDirection='column' gap='x32' paddingBlockEnd='x24'>
		{children}
	</Box>
);

export default WorkspaceCardSections;
