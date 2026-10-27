import { Box } from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';

export type WorkspaceCardSectionsProps = {
	/** The space kept below each section, on top of the card body's own gap. */
	spacing: 8 | 24;
	children: ReactNode;
};

const CARD_BODY_GAP = 8;

const WorkspaceCardSections = ({ spacing, children }: WorkspaceCardSectionsProps) => (
	<Box display='flex' flexDirection='column' gap={spacing + CARD_BODY_GAP} marginBlockEnd={spacing}>
		{children}
	</Box>
);

export default WorkspaceCardSections;
