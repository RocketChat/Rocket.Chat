import { Text } from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';

import WorkspaceCardSectionTitle from './WorkspaceCardSectionTitle';

export type WorkspaceCardDetailProps = {
	label: string;
	children: ReactNode;
};

/**
 * One labelled value in a workspace card, its label on the line above it.
 */
const WorkspaceCardDetail = ({ label, children }: WorkspaceCardDetailProps) => (
	<Text fontScale='p2'>
		<WorkspaceCardSectionTitle title={label} />
		{children}
	</Text>
);

export default WorkspaceCardDetail;
