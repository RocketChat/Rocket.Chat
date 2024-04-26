import { Box } from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';
import React from 'react';

type WorkspaceCardSectionProps = {
	title: string;
	body?: ReactNode;
};

const WorkspaceCardSection = ({ title, body }: WorkspaceCardSectionProps) => {
	return (
		<Box fontScale='c1'>
			<Box fontScale='c2'>{title}</Box>
			{body && body}
		</Box>
	);
};

export default WorkspaceCardSection;
