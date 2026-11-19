import { Box } from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';

type WorkspaceCardDetailsProps = {
	children: ReactNode;
};

/**
 * The labelled values under a card's title, spaced apart and kept clear of the title and of the card's controls.
 */
const WorkspaceCardDetails = ({ children }: WorkspaceCardDetailsProps) => (
	<Box display='flex' flexDirection='column' gap='x16' paddingBlockStart='x20' paddingBlockEnd='x8'>
		{children}
	</Box>
);

export default WorkspaceCardDetails;
