import { Box } from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';
import React from 'react';

type WorkspaceCardSectionWithHeaderProps = {
	title: string;
	body?: ReactNode;
	titleToContentGap?: number;
};

const WorkspaceCardSectionWithHeader = ({ title, body, titleToContentGap }: WorkspaceCardSectionWithHeaderProps) => {
	return (
		<Box fontScale='p2'>
			<Box fontScale='h4' marginBlockEnd={titleToContentGap}>
				{title}
			</Box>
			{body && body}
		</Box>
	);
};

export default WorkspaceCardSectionWithHeader;
