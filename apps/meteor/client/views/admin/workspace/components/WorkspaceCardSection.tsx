import { Stack, Text } from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';

import WorkspaceCardSectionTitle from './WorkspaceCardSectionTitle';

export type WorkspaceCardSectionProps = {
	title: string;
	children: ReactNode;
};

/**
 * A titled group of figures in a workspace card.
 */
const WorkspaceCardSection = ({ title, children }: WorkspaceCardSectionProps) => (
	<Stack gap='x16'>
		<WorkspaceCardSectionTitle title={title} variant='h4' />
		<Text fontScale='p2'>{children}</Text>
	</Stack>
);

export default WorkspaceCardSection;
