import { Box } from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';
import React from 'react';

type WorkspaceCardSectionProps = {
	title: string;
	body?: ReactNode;
	isHeader?: boolean;
};

const WorkspaceCardSection = ({ title, body }: WorkspaceCardSectionProps) => {
	return (
		<Box fontScale='p2'>
			<Box fontScale='p2b'>{title}</Box>
			{body && body}
		</Box>
	);
};

export default WorkspaceCardSection;
